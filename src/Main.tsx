import * as React from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import PlayerControls from './components/PlayerControls';
import { GlobalStyle, PlayerRoot } from './components/playerStyles';
import PlayerViewer from './components/PlayerViewer';
import {
  LoadedMedia,
  MediaHint,
  ProjectionMode,
  StereoLayout,
} from './types/player';

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported: (mode: 'immersive-vr') => Promise<boolean>;
  };
};

type TextureSet = {
  base: THREE.Texture;
  left: THREE.Texture;
  right: THREE.Texture;
  isVideo: boolean;
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|bmp|gif)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv|m3u8)(\?.*)?$/i;

const formatTime = (seconds: number): string => {
  const pad2 = (value: number): string =>
    value < 10 ? `0${value}` : String(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const secs = wholeSeconds % 60;

  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`;
  }

  return `${pad2(minutes)}:${pad2(secs)}`;
};

const inferMediaType = (
  value: string,
  hint: MediaHint,
): Exclude<LoadedMedia, null> => {
  if (hint === 'video') {
    return 'video';
  }

  if (hint === 'image') {
    return 'image';
  }

  if (IMAGE_EXTENSIONS.test(value)) {
    return 'image';
  }

  if (VIDEO_EXTENSIONS.test(value)) {
    return 'video';
  }

  return 'video';
};

const createProjectionGeometry = (
  mode: ProjectionMode,
): THREE.SphereGeometry => {
  const geometry =
    mode === '180'
      ? new THREE.SphereGeometry(500, 72, 48, -Math.PI / 2, Math.PI)
      : new THREE.SphereGeometry(500, 72, 48);

  geometry.scale(-1, 1, 1);
  return geometry;
};

const cloneTexture = (source: THREE.Texture): THREE.Texture => {
  const clone = source.clone();
  clone.needsUpdate = true;
  return clone;
};

const createTextureSet = (
  base: THREE.Texture,
  isVideo: boolean,
): TextureSet => {
  return {
    base,
    left: cloneTexture(base),
    right: cloneTexture(base),
    isVideo,
  };
};

const disposeTextureSet = (set: TextureSet | null): void => {
  if (!set) {
    return;
  }

  if (set.isVideo) {
    set.base.dispose();
    set.left.dispose();
    set.right.dispose();
    return;
  }

  set.base.dispose();
  set.left.dispose();
  set.right.dispose();
};

const applyStereoLayoutToTextureSet = (
  layout: StereoLayout,
  set: TextureSet,
  swapEyes: boolean,
): void => {
  const targets = [set.left, set.right];

  for (const texture of targets) {
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.needsUpdate = true;
  }

  if (layout === 'left-right') {
    set.left.repeat.set(0.5, 1);
    set.left.offset.set(swapEyes ? 0.5 : 0, 0);
    set.right.repeat.set(0.5, 1);
    set.right.offset.set(swapEyes ? 0 : 0.5, 0);
  }

  if (layout === 'top-bottom') {
    set.left.repeat.set(1, 0.5);
    set.left.offset.set(0, swapEyes ? 0 : 0.5);
    set.right.repeat.set(1, 0.5);
    set.right.offset.set(0, swapEyes ? 0.5 : 0);
  }

  set.left.needsUpdate = true;
  set.right.needsUpdate = true;
};

const DEFAULT_SOURCE =
  'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4';
const VR_MODE_STORAGE_KEY = 'vr_player_vr_mode';
const STEREO_LAYOUT_STORAGE_KEY = 'vr_player_stereo_layout';
const FIT_THRESHOLD_STORAGE_KEY = 'vr_player_fit_threshold';
const MIN_FIT_THRESHOLD = 0.05;
const MAX_FIT_THRESHOLD = 0.5;
const DEFAULT_FIT_THRESHOLD = 0.22;
const KEYBOARD_SEEK_STEP_SECONDS = 10;
const KEYBOARD_VOLUME_STEP = 0.05;

const clampFitThreshold = (value: number): number =>
  Math.min(MAX_FIT_THRESHOLD, Math.max(MIN_FIT_THRESHOLD, value));

const readStoredFitThreshold = (): number => {
  try {
    const stored = window.localStorage.getItem(FIT_THRESHOLD_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_FIT_THRESHOLD;
    }

    const parsed = Number(stored);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_FIT_THRESHOLD;
    }

    return clampFitThreshold(parsed);
  } catch {
    return DEFAULT_FIT_THRESHOLD;
  }
};

const isStereoLayout = (value: string): value is StereoLayout =>
  value === 'mono' || value === 'left-right' || value === 'top-bottom';

const readStoredStereoLayout = (): StereoLayout => {
  try {
    const stored = window.localStorage.getItem(STEREO_LAYOUT_STORAGE_KEY);
    if (!stored || !isStereoLayout(stored)) {
      return 'mono';
    }

    return stored;
  } catch {
    return 'mono';
  }
};

const readStoredVrModeEnabled = (): boolean => {
  try {
    const stored = window.localStorage.getItem(VR_MODE_STORAGE_KEY);
    return stored === 'true' || stored === '1';
  } catch {
    return false;
  }
};

const Main: React.FC = () => {
  const isDesktopApp = Boolean(window.electronAPI?.isDesktop);

  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const playerShellRef = React.useRef<HTMLElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const cleanupObjectUrlRef = React.useRef<string | null>(null);
  const loadTokenRef = React.useRef<number>(0);

  const currentTextureSetRef = React.useRef<TextureSet | null>(null);
  const videoTextureSetRef = React.useRef<TextureSet | null>(null);
  const activeImageTextureSetRef = React.useRef<TextureSet | null>(null);
  const textureLoaderRef = React.useRef<THREE.TextureLoader | null>(null);

  const stereoLayoutRef = React.useRef<StereoLayout>('mono');
  const swapEyesRef = React.useRef<boolean>(false);
  const vrModeEnabledRef = React.useRef<boolean>(false);
  const fitMismatchThresholdRef = React.useRef<number>(DEFAULT_FIT_THRESHOLD);
  const projectionModeRef = React.useRef<ProjectionMode>('360');
  const loadedMediaRef = React.useRef<LoadedMedia>(null);

  const applyTextureSetRef = React.useRef<(set: TextureSet) => void>(
    () => undefined,
  );
  const updateProjectionGeometryRef = React.useRef<
    (mode: ProjectionMode) => void
  >(() => undefined);
  const updateStereoLayoutRef = React.useRef<(layout: StereoLayout) => void>(
    () => undefined,
  );
  const updateVrModeRef = React.useRef<(enabled: boolean) => void>(
    () => undefined,
  );
  const updateFlatMeshSizeRef = React.useRef<() => void>(() => undefined);

  const [sourceUrl, setSourceUrl] = React.useState<string>(DEFAULT_SOURCE);
  const [mediaHint, setMediaHint] = React.useState<MediaHint>('auto');
  const [loadedMedia, setLoadedMediaState] = React.useState<LoadedMedia>(null);
  const [projectionMode, setProjectionMode] =
    React.useState<ProjectionMode>('360');
  const [stereoLayout, setStereoLayout] = React.useState<StereoLayout>(
    readStoredStereoLayout,
  );
  const [vrModeEnabled, setVrModeEnabled] = React.useState<boolean>(
    readStoredVrModeEnabled,
  );
  const [fitMismatchThreshold, setFitMismatchThreshold] =
    React.useState<number>(readStoredFitThreshold);
  const [swapEyes, setSwapEyes] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<string>(
    'Scene ready. Load media and press Play.',
  );
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [volume, setVolume] = React.useState<number>(1);
  const [timelineCurrent, setTimelineCurrent] = React.useState<number>(0);
  const [timelineDuration, setTimelineDuration] = React.useState<number>(0);
  const [xrSupported, setXrSupported] = React.useState<boolean | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const setLoadedMedia = React.useCallback((value: LoadedMedia): void => {
    loadedMediaRef.current = value;
    setLoadedMediaState(value);
  }, []);

  React.useEffect(() => {
    stereoLayoutRef.current = stereoLayout;
    swapEyesRef.current = swapEyes;
    updateStereoLayoutRef.current(stereoLayout);
  }, [stereoLayout, swapEyes]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STEREO_LAYOUT_STORAGE_KEY, stereoLayout);
    } catch {
      // Ignore persistence errors (private mode / blocked storage).
    }
  }, [stereoLayout]);

  React.useEffect(() => {
    projectionModeRef.current = projectionMode;
    updateProjectionGeometryRef.current(projectionMode);
  }, [projectionMode]);

  React.useEffect(() => {
    vrModeEnabledRef.current = vrModeEnabled;
    updateVrModeRef.current(vrModeEnabled);

    try {
      window.localStorage.setItem(VR_MODE_STORAGE_KEY, String(vrModeEnabled));
    } catch {
      // Ignore persistence errors (private mode / blocked storage).
    }
  }, [vrModeEnabled]);

  React.useEffect(() => {
    const clampedValue = clampFitThreshold(fitMismatchThreshold);
    fitMismatchThresholdRef.current = clampedValue;

    try {
      window.localStorage.setItem(
        FIT_THRESHOLD_STORAGE_KEY,
        String(clampedValue),
      );
    } catch {
      // Ignore persistence errors (private mode / blocked storage).
    }

    updateFlatMeshSizeRef.current();
  }, [fitMismatchThreshold]);

  React.useEffect(() => {
    const onFullscreenChange = (): void => {
      setIsFullscreen(document.fullscreenElement === playerShellRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  React.useEffect(() => {
    const mountEl = mountRef.current;

    if (!mountEl) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.xr.enabled = vrModeEnabledRef.current;
    mountEl.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    textureLoaderRef.current = textureLoader;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountEl.clientWidth / mountEl.clientHeight,
      0.1,
      2000,
    );
    camera.position.set(0, 0, 0.1);

    const monoGeometry = createProjectionGeometry(projectionModeRef.current);
    const leftGeometry = createProjectionGeometry(projectionModeRef.current);
    const rightGeometry = createProjectionGeometry(projectionModeRef.current);

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    videoRef.current = video;

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;

    const videoTextureSet = createTextureSet(texture, true);
    videoTextureSetRef.current = videoTextureSet;

    const monoMaterial = new THREE.MeshBasicMaterial({
      map: videoTextureSet.base,
    });
    const leftMaterial = new THREE.MeshBasicMaterial({
      map: videoTextureSet.left,
    });
    const rightMaterial = new THREE.MeshBasicMaterial({
      map: videoTextureSet.right,
    });

    const monoMesh = new THREE.Mesh(monoGeometry, monoMaterial);
    const leftMesh = new THREE.Mesh(leftGeometry, leftMaterial);
    const rightMesh = new THREE.Mesh(rightGeometry, rightMaterial);
    const flatGeometry = new THREE.PlaneGeometry(1, 1);
    const flatMaterial = new THREE.MeshBasicMaterial({
      map: videoTextureSet.base,
      side: THREE.DoubleSide,
    });
    const flatMesh = new THREE.Mesh(flatGeometry, flatMaterial);
    const flatViewDistance = 4;
    flatMesh.position.set(0, 0, -flatViewDistance);

    leftMesh.layers.set(1);
    rightMesh.layers.set(2);

    scene.add(monoMesh);
    scene.add(leftMesh);
    scene.add(rightMesh);
    scene.add(flatMesh);

    currentTextureSetRef.current = videoTextureSet;
    applyStereoLayoutToTextureSet(
      stereoLayoutRef.current,
      videoTextureSet,
      swapEyesRef.current,
    );

    const getActiveMediaAspect = (): number => {
      const activeSet = currentTextureSetRef.current;
      if (!activeSet) {
        return 16 / 9;
      }

      const source = activeSet.base.image as
        | {
            videoWidth?: number;
            videoHeight?: number;
            width?: number;
            height?: number;
          }
        | undefined;

      const width = source?.videoWidth ?? source?.width;
      const height = source?.videoHeight ?? source?.height;

      if (
        !width ||
        !height ||
        !Number.isFinite(width) ||
        !Number.isFinite(height)
      ) {
        return 16 / 9;
      }

      const aspect = width / height;
      return Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
    };

    const updateFlatMeshSize = (): void => {
      const mediaAspect = getActiveMediaAspect();
      const distance = Math.abs(flatMesh.position.z - camera.position.z);
      const fovRadians = THREE.MathUtils.degToRad(camera.fov);
      const viewportHeight = 2 * distance * Math.tan(fovRadians / 2);
      const viewportWidth = viewportHeight * camera.aspect;
      const viewportAspect = viewportWidth / viewportHeight;
      const aspectMismatch =
        Math.abs(mediaAspect - viewportAspect) / viewportAspect;
      const useContain = aspectMismatch > fitMismatchThresholdRef.current;

      let width = viewportWidth;
      let height = width / mediaAspect;

      if (useContain) {
        if (height > viewportHeight) {
          height = viewportHeight;
          width = height * mediaAspect;
        }
      } else if (height < viewportHeight) {
        height = viewportHeight;
        width = height * mediaAspect;
      }

      flatMesh.scale.set(width, height, 1);
    };

    updateFlatMeshSizeRef.current = updateFlatMeshSize;

    const setMeshVisibility = (): void => {
      if (!vrModeEnabledRef.current) {
        monoMesh.visible = false;
        leftMesh.visible = false;
        rightMesh.visible = false;
        flatMesh.visible = true;
        return;
      }

      const usingStereoVideo =
        renderer.xr.isPresenting &&
        loadedMediaRef.current === 'video' &&
        stereoLayoutRef.current !== 'mono';

      flatMesh.visible = false;
      monoMesh.visible = !usingStereoVideo;
      leftMesh.visible = usingStereoVideo;
      rightMesh.visible = usingStereoVideo;
    };

    applyTextureSetRef.current = (set: TextureSet): void => {
      currentTextureSetRef.current = set;
      monoMaterial.map = set.base;
      leftMaterial.map = set.left;
      rightMaterial.map = set.right;
      flatMaterial.map = set.base;
      monoMaterial.needsUpdate = true;
      leftMaterial.needsUpdate = true;
      rightMaterial.needsUpdate = true;
      flatMaterial.needsUpdate = true;
      applyStereoLayoutToTextureSet(
        stereoLayoutRef.current,
        set,
        swapEyesRef.current,
      );
      updateFlatMeshSize();
      setMeshVisibility();
    };

    updateStereoLayoutRef.current = (layout: StereoLayout): void => {
      const activeSet = currentTextureSetRef.current;
      if (!activeSet) {
        return;
      }

      applyStereoLayoutToTextureSet(layout, activeSet, swapEyesRef.current);
      setMeshVisibility();
    };

    updateProjectionGeometryRef.current = (mode: ProjectionMode): void => {
      const nextMonoGeometry = createProjectionGeometry(mode);
      const nextLeftGeometry = createProjectionGeometry(mode);
      const nextRightGeometry = createProjectionGeometry(mode);

      monoMesh.geometry.dispose();
      leftMesh.geometry.dispose();
      rightMesh.geometry.dispose();

      monoMesh.geometry = nextMonoGeometry;
      leftMesh.geometry = nextLeftGeometry;
      rightMesh.geometry = nextRightGeometry;
    };

    let lon = 0;
    let lat = 0;
    let isPointerDown = false;
    let onPointerDownPointerX = 0;
    let onPointerDownPointerY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    const onPointerDown = (event: PointerEvent): void => {
      isPointerDown = true;
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (!isPointerDown) {
        return;
      }

      lon = (onPointerDownPointerX - event.clientX) * 0.15 + onPointerDownLon;
      lat = (event.clientY - onPointerDownPointerY) * 0.15 + onPointerDownLat;
    };

    const onPointerUp = (): void => {
      isPointerDown = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerUp);

    const onVideoPlay = (): void => setIsPlaying(true);
    const onVideoPause = (): void => setIsPlaying(false);
    const onVideoEnded = (): void => setIsPlaying(false);
    const onVideoCanPlay = (): void => {
      setLoadedMedia('video');
      setStatus('Video loaded. Use Enter VR to watch in headset.');
    };
    const onVideoError = (): void =>
      setStatus('Unable to load media. Try another URL or local file.');
    const onVideoLoadedMetadata = (): void => {
      setTimelineDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setTimelineCurrent(video.currentTime || 0);
      updateFlatMeshSize();
    };
    const onVideoTimeUpdate = (): void => {
      setTimelineCurrent(video.currentTime || 0);
    };
    const onVideoEmptied = (): void => {
      setTimelineCurrent(0);
      setTimelineDuration(0);
    };

    let vrButton: HTMLElement | null = null;

    const syncVrUi = (): void => {
      renderer.xr.enabled = vrModeEnabledRef.current;

      if (!vrButton) {
        return;
      }

      if (vrModeEnabledRef.current) {
        if (!mountEl.contains(vrButton)) {
          mountEl.appendChild(vrButton);
        }
      } else if (mountEl.contains(vrButton)) {
        mountEl.removeChild(vrButton);
      }
    };

    video.addEventListener('play', onVideoPlay);
    video.addEventListener('pause', onVideoPause);
    video.addEventListener('ended', onVideoEnded);
    video.addEventListener('canplay', onVideoCanPlay);
    video.addEventListener('error', onVideoError);
    video.addEventListener('loadedmetadata', onVideoLoadedMetadata);
    video.addEventListener('timeupdate', onVideoTimeUpdate);
    video.addEventListener('emptied', onVideoEmptied);
    renderer.xr.addEventListener('sessionstart', setMeshVisibility);
    renderer.xr.addEventListener('sessionend', setMeshVisibility);

    updateVrModeRef.current = (enabled: boolean): void => {
      vrModeEnabledRef.current = enabled;
      if (!enabled) {
        const session = renderer.xr.getSession();
        if (session) {
          void session.end();
        }
      }

      syncVrUi();
      setMeshVisibility();
    };

    const xrNav = navigator as XRNavigator;
    if (xrNav.xr) {
      xrNav.xr
        .isSessionSupported('immersive-vr')
        .then((supported) => {
          setXrSupported(supported);
          if (supported) {
            const createdVrButton = VRButton.createButton(renderer);
            createdVrButton.classList.add('vr-enter-button');
            vrButton = createdVrButton;
            syncVrUi();
          } else {
            setStatus(
              'VR headset session not available. Desktop preview is still active.',
            );
          }
        })
        .catch(() => {
          setXrSupported(false);
          setStatus('WebXR check failed. Desktop preview is still active.');
        });
    } else {
      setXrSupported(false);
      setStatus('WebXR is not available in this browser.');
    }

    const onResize = (): void => {
      if (!mountRef.current) {
        return;
      }

      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight,
      );
      updateFlatMeshSize();
    };

    window.addEventListener('resize', onResize);

    setLoadedMedia('video');
    updateFlatMeshSize();
    syncVrUi();
    setMeshVisibility();

    renderer.setAnimationLoop(() => {
      if (!vrModeEnabledRef.current) {
        camera.lookAt(0, 0, -1);
        renderer.render(scene, camera);
        return;
      }

      lat = Math.max(-85, Math.min(85, lat));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);

      video.removeEventListener('play', onVideoPlay);
      video.removeEventListener('pause', onVideoPause);
      video.removeEventListener('ended', onVideoEnded);
      video.removeEventListener('canplay', onVideoCanPlay);
      video.removeEventListener('error', onVideoError);
      video.removeEventListener('loadedmetadata', onVideoLoadedMetadata);
      video.removeEventListener('timeupdate', onVideoTimeUpdate);
      video.removeEventListener('emptied', onVideoEmptied);
      renderer.xr.removeEventListener('sessionstart', setMeshVisibility);
      renderer.xr.removeEventListener('sessionend', setMeshVisibility);

      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerUp);

      if (vrButton && mountEl.contains(vrButton)) {
        mountEl.removeChild(vrButton);
      }

      if (cleanupObjectUrlRef.current) {
        URL.revokeObjectURL(cleanupObjectUrlRef.current);
        cleanupObjectUrlRef.current = null;
      }

      if (activeImageTextureSetRef.current) {
        disposeTextureSet(activeImageTextureSetRef.current);
        activeImageTextureSetRef.current = null;
      }

      if (videoTextureSetRef.current) {
        disposeTextureSet(videoTextureSetRef.current);
        videoTextureSetRef.current = null;
      }

      monoMesh.geometry.dispose();
      leftMesh.geometry.dispose();
      rightMesh.geometry.dispose();
      flatMesh.geometry.dispose();

      monoMaterial.dispose();
      leftMaterial.dispose();
      rightMaterial.dispose();
      flatMaterial.dispose();

      renderer.dispose();

      video.pause();
      video.removeAttribute('src');
      video.load();
      videoRef.current = null;
      textureLoaderRef.current = null;
      currentTextureSetRef.current = null;
      applyTextureSetRef.current = () => undefined;
      updateStereoLayoutRef.current = () => undefined;
      updateProjectionGeometryRef.current = () => undefined;
      updateVrModeRef.current = () => undefined;
      updateFlatMeshSizeRef.current = () => undefined;

      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [setLoadedMedia]);

  const setVideoSource = (source: string, label: string): void => {
    const video = videoRef.current;
    const videoSet = videoTextureSetRef.current;
    if (!video || !videoSet) {
      return;
    }

    if (activeImageTextureSetRef.current) {
      disposeTextureSet(activeImageTextureSetRef.current);
      activeImageTextureSetRef.current = null;
    }

    applyTextureSetRef.current(videoSet);
    setLoadedMedia('video');

    video.pause();
    video.srcObject = null;
    video.src = source;
    video.load();

    setTimelineCurrent(0);
    setTimelineDuration(0);
    setStatus(`Loading ${label} video...`);
  };

  const setImageSource = async (
    source: string,
    requestToken: number,
    label: string,
  ): Promise<void> => {
    const loader = textureLoaderRef.current;
    if (!loader) {
      return;
    }

    setStatus(`Loading ${label} image...`);

    try {
      const baseTexture = await loader.loadAsync(source);
      baseTexture.colorSpace = THREE.SRGBColorSpace;

      const imageTextureSet = createTextureSet(baseTexture, false);
      applyStereoLayoutToTextureSet(
        stereoLayoutRef.current,
        imageTextureSet,
        swapEyesRef.current,
      );

      if (requestToken !== loadTokenRef.current) {
        disposeTextureSet(imageTextureSet);
        return;
      }

      if (activeImageTextureSetRef.current) {
        disposeTextureSet(activeImageTextureSetRef.current);
      }

      activeImageTextureSetRef.current = imageTextureSet;
      applyTextureSetRef.current(imageTextureSet);

      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }

      setIsPlaying(false);
      setTimelineCurrent(0);
      setTimelineDuration(0);
      setLoadedMedia('image');
      setStatus(
        `${label} image loaded. You can enter VR to view the panorama.`,
      );
    } catch {
      if (requestToken === loadTokenRef.current) {
        setStatus(`Unable to load ${label} image.`);
      }
    }
  };

  const loadFromUrl = async (): Promise<void> => {
    const url = sourceUrl.trim();
    if (!url) {
      setStatus('Enter a media URL first.');
      return;
    }

    const type = inferMediaType(url, mediaHint);
    const requestToken = ++loadTokenRef.current;

    if (cleanupObjectUrlRef.current) {
      URL.revokeObjectURL(cleanupObjectUrlRef.current);
      cleanupObjectUrlRef.current = null;
    }

    if (type === 'image') {
      await setImageSource(url, requestToken, 'URL');
      return;
    }

    setVideoSource(url, 'URL');
  };

  React.useEffect(() => {
    if (!isDesktopApp || !window.electronAPI) {
      return;
    }

    const disposeFileListener = window.electronAPI.onMenuOpenFile((fileUrl) => {
      setSourceUrl(fileUrl);

      const requestToken = ++loadTokenRef.current;
      if (inferMediaType(fileUrl, 'auto') === 'image') {
        void setImageSource(fileUrl, requestToken, 'Desktop menu');
        return;
      }

      setVideoSource(fileUrl, 'Desktop menu');
    });

    const disposeUrlListener = window.electronAPI.onMenuOpenUrl(() => {
      void (async () => {
        if (!window.electronAPI) {
          return;
        }

        const input = await window.electronAPI.requestMediaUrl(sourceUrl);
        if (!input) {
          return;
        }

        const nextUrl = input.trim();
        if (!nextUrl) {
          return;
        }

        setSourceUrl(nextUrl);

        const requestToken = ++loadTokenRef.current;
        if (inferMediaType(nextUrl, mediaHint) === 'image') {
          void setImageSource(nextUrl, requestToken, 'Desktop menu');
          return;
        }

        setVideoSource(nextUrl, 'Desktop menu');
      })();
    });

    return () => {
      disposeFileListener();
      disposeUrlListener();
    };
  }, [isDesktopApp, mediaHint, setImageSource, sourceUrl]);

  const loadFromFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const inferredHint: MediaHint = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : mediaHint;

    if (cleanupObjectUrlRef.current) {
      URL.revokeObjectURL(cleanupObjectUrlRef.current);
      cleanupObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    cleanupObjectUrlRef.current = objectUrl;
    const requestToken = ++loadTokenRef.current;

    if (inferMediaType(file.name, inferredHint) === 'image') {
      await setImageSource(objectUrl, requestToken, `local ${file.name}`);
      return;
    }

    setVideoSource(objectUrl, `local ${file.name}`);
  };

  const togglePlayback = async (): Promise<void> => {
    const video = videoRef.current;
    if (!video || loadedMedia !== 'video') {
      setStatus('Playback controls are available only for video media.');
      return;
    }

    if (video.paused) {
      try {
        await video.play();
        setStatus('Playing media.');
      } catch {
        setStatus(
          'Playback blocked by browser. Click Play again after interaction.',
        );
      }
      return;
    }

    video.pause();
    setStatus('Paused.');
  };

  const toggleMute = (): void => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const onVolumeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const next = Number(event.target.value);
    setVolume(next);

    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.volume = next;
    if (next > 0 && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const onSeekChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const next = Number(event.target.value);
    setTimelineCurrent(next);

    const video = videoRef.current;
    if (!video || loadedMedia !== 'video') {
      return;
    }

    video.currentTime = next;
  };

  const toggleFullscreen = async (): Promise<void> => {
    const playerShell = playerShellRef.current;

    if (!playerShell) {
      return;
    }

    try {
      if (document.fullscreenElement === playerShell) {
        await document.exitFullscreen();
        return;
      }

      await playerShell.requestFullscreen();
    } catch {
      setStatus('Fullscreen action was blocked by the browser.');
    }
  };

  const seekBySeconds = React.useCallback((deltaSeconds: number): void => {
    const video = videoRef.current;
    if (!video || loadedMediaRef.current !== 'video') {
      return;
    }

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    const next = Math.min(
      video.duration,
      Math.max(0, video.currentTime + deltaSeconds),
    );
    video.currentTime = next;
    setTimelineCurrent(next);
  }, []);

  const adjustVolumeByStep = React.useCallback((delta: number): void => {
    const video = videoRef.current;
    if (!video || loadedMediaRef.current !== 'video') {
      return;
    }

    const next = Math.min(1, Math.max(0, video.volume + delta));
    video.volume = next;
    setVolume(next);

    if (next > 0 && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const isTextEntryTarget =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          tag === 'BUTTON' ||
          target.isContentEditable;

        if (isTextEntryTarget) {
          return;
        }
      }

      if (event.code === 'Space') {
        event.preventDefault();
        void togglePlayback();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        seekBySeconds(-KEYBOARD_SEEK_STEP_SECONDS);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        seekBySeconds(KEYBOARD_SEEK_STEP_SECONDS);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        adjustVolumeByStep(KEYBOARD_VOLUME_STEP);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        adjustVolumeByStep(-KEYBOARD_VOLUME_STEP);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [adjustVolumeByStep, seekBySeconds, togglePlayback]);

  return (
    <>
      <GlobalStyle />
      <PlayerRoot>
        <PlayerViewer
          shellRef={playerShellRef}
          mountRef={mountRef}
          isFullscreen={isFullscreen}
          controls={
            <PlayerControls
              insidePlayer
              showSourceInputs={!isDesktopApp}
              mediaHint={mediaHint}
              projectionMode={projectionMode}
              fitMismatchThreshold={fitMismatchThreshold}
              vrModeEnabled={vrModeEnabled}
              stereoLayout={stereoLayout}
              swapEyes={swapEyes}
              sourceUrl={sourceUrl}
              loadedMedia={loadedMedia}
              isPlaying={isPlaying}
              isMuted={isMuted}
              isFullscreen={isFullscreen}
              volume={volume}
              timelineCurrent={timelineCurrent}
              timelineDuration={timelineDuration}
              timelineLabel={`${formatTime(timelineCurrent)} / ${formatTime(timelineDuration)}`}
              status={status}
              xrSupported={xrSupported}
              onMediaHintChange={setMediaHint}
              onProjectionModeChange={setProjectionMode}
              onFitMismatchThresholdChange={setFitMismatchThreshold}
              onVrModeEnabledChange={setVrModeEnabled}
              onStereoLayoutChange={setStereoLayout}
              onSwapEyesChange={setSwapEyes}
              onSourceUrlChange={setSourceUrl}
              onLoadUrl={() => void loadFromUrl()}
              onLoadFile={(event) => void loadFromFile(event)}
              onTogglePlayback={() => void togglePlayback()}
              onToggleMute={toggleMute}
              onToggleFullscreen={() => void toggleFullscreen()}
              onVolumeChange={onVolumeChange}
              onSeekChange={onSeekChange}
            />
          }
        />
      </PlayerRoot>
    </>
  );
};

export default Main;
