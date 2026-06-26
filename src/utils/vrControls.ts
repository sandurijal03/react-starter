import * as THREE from 'three';

import {
  drawVrPanel,
  hitTestVrPanel,
  VR_PANEL_H,
  VR_PANEL_W,
  VrPanelTarget,
} from './vrPanel';

export type VrMediaState = {
  isPaused: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
};

export type VrControlsActions = {
  getMediaState: () => VrMediaState;
  togglePlay: () => void;
  toggleMute: () => void;
  seekBy: (seconds: number) => void;
  seekToRatio: (ratio: number) => void;
};

// Gaze-dwell time (seconds) to activate a target when no controller is used.
const DWELL_SECONDS = 1.6;
const PANEL_DISTANCE = 2;
const PANEL_DROP = 0.45;

export type VrControls = {
  update: () => void;
  dispose: () => void;
};

export const createVrControls = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  actions: VrControlsActions,
): VrControls => {
  const canvas = document.createElement('canvas');
  canvas.width = VR_PANEL_W;
  canvas.height = VR_PANEL_H;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const aspect = VR_PANEL_H / VR_PANEL_W;
  const geometry = new THREE.PlaneGeometry(1.2, 1.2 * aspect);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const panel = new THREE.Mesh(geometry, material);

  const group = new THREE.Group();
  group.add(panel);
  group.visible = false;
  scene.add(group);

  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  const cameraPos = new THREE.Vector3();
  const cameraDir = new THREE.Vector3();
  const clock = new THREE.Clock();

  let placed = false;
  let dwellTarget: VrPanelTarget | null = null;
  let dwellElapsed = 0;
  let lastSignature = '';

  const placeInFront = (): void => {
    camera.getWorldPosition(cameraPos);
    camera.getWorldDirection(cameraDir);
    group.position
      .copy(cameraPos)
      .add(cameraDir.multiplyScalar(PANEL_DISTANCE));
    group.position.y -= PANEL_DROP;
    // lookAt points the group's -z at the camera; rotate so the plane's front
    // (+z) faces the viewer (otherwise the single-sided face is culled).
    group.lookAt(cameraPos);
    group.rotateY(Math.PI);
    placed = true;
  };

  const trigger = (target: VrPanelTarget, ratio: number): void => {
    switch (target) {
      case 'playPause':
        actions.togglePlay();
        break;
      case 'mute':
        actions.toggleMute();
        break;
      case 'back':
        actions.seekBy(-10);
        break;
      case 'forward':
        actions.seekBy(10);
        break;
      case 'recenter':
        placeInFront();
        break;
      case 'seek':
        actions.seekToRatio(ratio);
        break;
    }
  };

  type ControllerEntry = {
    controller: THREE.Group;
    isConnected: () => boolean;
    dispose: () => void;
  };

  const buildController = (index: number): ControllerEntry => {
    const controller = renderer.xr.getController(index);

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5),
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff8f00,
      transparent: true,
      opacity: 0.6,
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    controller.add(line);

    let connected = false;
    const onConnected = (): void => {
      connected = true;
    };
    const onDisconnected = (): void => {
      connected = false;
    };

    const onSelectStart = (): void => {
      if (!group.visible) {
        return;
      }

      const hit = intersectFromController(controller);
      if (hit) {
        trigger(hit.target, hit.ratio);
      }
    };

    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('connected', onConnected);
    controller.addEventListener('disconnected', onDisconnected);
    scene.add(controller);

    return {
      controller,
      isConnected: () => connected,
      dispose: () => {
        controller.removeEventListener('selectstart', onSelectStart);
        controller.removeEventListener('connected', onConnected);
        controller.removeEventListener('disconnected', onDisconnected);
        controller.remove(line);
        scene.remove(controller);
        lineGeometry.dispose();
        lineMaterial.dispose();
      },
    };
  };

  const intersectFromController = (
    controller: THREE.Group,
  ): { target: VrPanelTarget; ratio: number } | null => {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const hits = raycaster.intersectObject(panel, false);
    const uv = hits[0]?.uv;
    return uv ? hitTestVrPanel(uv.x, uv.y) : null;
  };

  const intersectFromGaze = (): {
    target: VrPanelTarget;
    ratio: number;
  } | null => {
    camera.getWorldPosition(cameraPos);
    camera.getWorldDirection(cameraDir);
    raycaster.set(cameraPos, cameraDir);

    const hits = raycaster.intersectObject(panel, false);
    const uv = hits[0]?.uv;
    return uv ? hitTestVrPanel(uv.x, uv.y) : null;
  };

  const controllers = [buildController(0), buildController(1)];

  const hasConnectedController = (): boolean =>
    controllers.some((entry) => entry.isConnected());

  const redraw = (
    media: VrMediaState,
    hover: VrPanelTarget | null,
    dwell: number,
  ): void => {
    if (!ctx) {
      return;
    }

    const signature = `${media.isPaused}|${media.isMuted}|${Math.floor(media.currentTime)}|${Math.floor(media.duration)}|${hover ?? ''}|${Math.round(dwell * 8)}`;
    if (signature === lastSignature) {
      return;
    }
    lastSignature = signature;

    drawVrPanel(ctx, {
      isPaused: media.isPaused,
      isMuted: media.isMuted,
      currentTime: media.currentTime,
      duration: media.duration,
      hover,
      dwell,
    });
    texture.needsUpdate = true;
  };

  const update = (): void => {
    const dt = clock.getDelta();

    if (!renderer.xr.isPresenting) {
      if (group.visible) {
        group.visible = false;
        placed = false;
      }
      return;
    }

    if (!group.visible) {
      group.visible = true;
    }
    if (!placed) {
      placeInFront();
    }

    // A controller pointing at the panel takes precedence over gaze.
    let hover: VrPanelTarget | null = null;
    let fromController = false;

    for (const { controller } of controllers) {
      const hit = intersectFromController(controller);
      if (hit) {
        hover = hit.target;
        fromController = true;
        break;
      }
    }

    let dwell = 0;
    if (!fromController && !hasConnectedController()) {
      const gaze = intersectFromGaze();
      if (gaze) {
        hover = gaze.target;

        if (dwellTarget === gaze.target) {
          dwellElapsed += dt;
        } else {
          dwellTarget = gaze.target;
          dwellElapsed = 0;
        }

        dwell = Math.min(1, dwellElapsed / DWELL_SECONDS);
        if (dwellElapsed >= DWELL_SECONDS) {
          trigger(gaze.target, gaze.ratio);
          dwellElapsed = 0;
          dwellTarget = null;
        }
      } else {
        dwellTarget = null;
        dwellElapsed = 0;
      }
    } else {
      dwellTarget = null;
      dwellElapsed = 0;
    }

    redraw(actions.getMediaState(), hover, dwell);
  };

  const dispose = (): void => {
    for (const entry of controllers) {
      entry.dispose();
    }
    scene.remove(group);
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };

  return { update, dispose };
};
