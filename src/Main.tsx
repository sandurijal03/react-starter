import * as React from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import Hls from 'hls.js';
import PlayerControls from './components/PlayerControls';
import PlayerViewer from './components/PlayerViewer';
import { GlobalStyle, PlayerRoot } from './styles/playerStyles';
import {
  LoadedMedia,
  MediaHint,
  PlaylistItem,
  ProjectionMode,
  StereoLayout,
} from './types/player';
import { formatTime } from './utils/format';
import {
  detectMediaTraits,
  HLS_EXTENSIONS,
  inferMediaType,
  PERSISTABLE_SOURCE,
} from './utils/media';
import {
  applyStereoLayoutToTextureSet,
  createProjectionGeometry,
  createTextureSet,
  disposeTextureSet,
  TextureSet,
} from './utils/texture';
import {
  clampFitThreshold,
  DEFAULT_FIT_THRESHOLD,
  FIT_THRESHOLD_STORAGE_KEY,
  LOOP_STORAGE_KEY,
  MAX_RECENT_ITEMS,
  readStoredFitThreshold,
  readStoredLooping,
  readStoredRecentItems,
  readStoredStereoLayout,
  readStoredVrModeEnabled,
  RECENT_STORAGE_KEY,
  STEREO_LAYOUT_STORAGE_KEY,
  VR_MODE_STORAGE_KEY,
} from './utils/storage';

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported: (mode: 'immersive-vr') => Promise<boolean>;
  };
};

const DEFAULT_SOURCE =
  'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4';
const KEYBOARD_SEEK_STEP_SECONDS = 10;
const KEYBOARD_VOLUME_STEP = 0.05;
const PLAYBACK_RATE_OPTIONS = [0.5, 1, 1.5, 2];
const DEFAULT_PLAYBACK_RATE = 1;

const Main: React.FC = () => {
  const isDesktopApp = Boolean(window.electronAPI?.isDesktop);

  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const playerShellRef = React.useRef<HTMLElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const loadTokenRef = React.useRef<number>(0);
  const hlsRef = React.useRef<Hls | null>(null);
  // Object URLs created for dropped/picked local files. Kept alive for the
  // whole session so playlist navigation can revisit them, then revoked on
  // unmount.
  const objectUrlsRef = React.useRef<Set<string>>(new Set());
  const idCounterRef = React.useRef<number>(0);
  const playlistRef = React.useRef<PlaylistItem[]>([]);
  const currentIndexRef = React.useRef<number>(-1);
  const playbackRateRef = React.useRef<number>(DEFAULT_PLAYBACK_RATE);

  const currentTextureSetRef = React.useRef<TextureSet | null>(null);
  const videoTextureSetRef = React.useRef<TextureSet | null>(null);
  const activeImageTextureSetRef = React.useRef<TextureSet | null>(null);
  const textureLoaderRef = React.useRef<THREE.TextureLoader | null>(null);

  const stereoLayoutRef = React.useRef<StereoLayout>('mono');
  const swapEyesRef = React.useRef<boolean>(false);
  const vrModeEnabledRef = React.useRef<boolean>(false);
  const isLoopingRef = React.useRef<boolean>(true);
  const recenterViewRef = React.useRef<() => void>(() => undefined);
  const autoAdvanceRef = React.useRef<() => void>(() => undefined);
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
  const [isWindowFullscreen, setIsWindowFullscreen] =
    React.useState<boolean>(false);
  const [isWindowMaximized, setIsWindowMaximized] =
    React.useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = React.useState<number>(
    DEFAULT_PLAYBACK_RATE,
  );
  const [isLooping, setIsLooping] = React.useState<boolean>(readStoredLooping);
  const [playlist, setPlaylist] = React.useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);
  const [recentItems, setRecentItems] = React.useState<PlaylistItem[]>(
    readStoredRecentItems,
  );

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
    playbackRateRef.current = playbackRate;
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  React.useEffect(() => {
    isLoopingRef.current = isLooping;
    const video = videoRef.current;
    if (video) {
      video.loop = isLooping;
    }

    try {
      window.localStorage.setItem(LOOP_STORAGE_KEY, String(isLooping));
    } catch {
      // Ignore persistence errors (private mode / blocked storage).
    }
  }, [isLooping]);

  React.useEffect(() => {
    const detectFullscreen = (): void => {
      // Fullscreen API (the in-app fullscreen button) is the single source of
      // truth for DOM fullscreen.
      const byApi = Boolean(document.fullscreenElement);

      // Size-based fallback for F11 / native fullscreen only matters in a plain
      // browser. In the desktop app the native enter/leave-full-screen events
      // already cover it, and this heuristic desyncs (taskbar / DPI rounding),
      // so it is disabled there.
      const bySize =
        !isDesktopApp &&
        Math.abs(window.innerWidth - window.screen.width) <= 2 &&
        Math.abs(window.innerHeight - window.screen.height) <= 2;

      setIsFullscreen(byApi || bySize);
    };

    detectFullscreen();
    document.addEventListener('fullscreenchange', detectFullscreen);
    window.addEventListener('resize', detectFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', detectFullscreen);
      window.removeEventListener('resize', detectFullscreen);
    };
  }, [isDesktopApp]);

  React.useEffect(() => {
    if (!isDesktopApp || !window.electronAPI) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const [fullscreen, maximized] = await Promise.all([
          window.electronAPI?.getWindowFullscreen(),
          window.electronAPI?.getWindowMaximized(),
        ]);
        if (active) {
          setIsWindowFullscreen(Boolean(fullscreen));
          setIsWindowMaximized(Boolean(maximized));
        }
      } catch {
        // Ignore desktop bridge failures and continue with DOM fullscreen only.
      }
    })();

    const disposeWindowFullscreenListener =
      window.electronAPI.onWindowFullscreenChange((next) => {
        setIsWindowFullscreen(next);
      });

    const disposeWindowMaximizeListener =
      window.electronAPI.onWindowMaximizeChange((next) => {
        setIsWindowMaximized(next);
      });

    return () => {
      active = false;
      disposeWindowFullscreenListener();
      disposeWindowMaximizeListener();
    };
  }, [isDesktopApp]);

  // True fullscreen drives the fullscreen toggle button's state.
  const isWindowedFullscreen = isFullscreen || isWindowFullscreen;
  // A maximized window should feel just as immersive: fill the viewer and let
  // the controls float in on hover instead of reserving a docked panel.
  const isImmersive = isWindowedFullscreen || isWindowMaximized;

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
    video.loop = isLoopingRef.current;
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

    recenterViewRef.current = (): void => {
      lon = 0;
      lat = 0;
      onPointerDownLon = 0;
      onPointerDownLat = 0;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerUp);

    const onVideoPlay = (): void => setIsPlaying(true);
    const onVideoPause = (): void => setIsPlaying(false);
    const onVideoEnded = (): void => {
      setIsPlaying(false);
      // Only fires when looping is off; advance to the next queued item.
      autoAdvanceRef.current();
    };
    const onVideoCanPlay = (): void => {
      setLoadedMedia('video');
      setStatus('Video loaded. Use Enter VR to watch in headset.');
    };
    const onVideoError = (): void =>
      setStatus('Unable to load media. Try another URL or local file.');
    const onVideoLoadedMetadata = (): void => {
      video.playbackRate = playbackRateRef.current;
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
      const width = mountEl.clientWidth;
      const height = mountEl.clientHeight;
      if (width === 0 || height === 0) {
        return;
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      updateFlatMeshSize();
    };

    window.addEventListener('resize', onResize);

    // Drive sizing from the canvas container's actual box, not just window
    // resizes. This keeps the WebGL buffer in sync when the canvas height
    // changes for CSS reasons (e.g. toggling fullscreen / immersive layout),
    // which would otherwise leave the video at a stale size.
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(mountEl);

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
      resizeObserver.disconnect();

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

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      for (const objectUrl of objectUrlsRef.current) {
        URL.revokeObjectURL(objectUrl);
      }
      objectUrlsRef.current.clear();

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
      recenterViewRef.current = () => undefined;

      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [setLoadedMedia]);

  const teardownHls = React.useCallback((): void => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const setVideoSource = React.useCallback(
    (source: string, label: string): void => {
      const video = videoRef.current;
      const videoSet = videoTextureSetRef.current;
      if (!video || !videoSet) {
        return;
      }

      teardownHls();

      if (activeImageTextureSetRef.current) {
        disposeTextureSet(activeImageTextureSetRef.current);
        activeImageTextureSetRef.current = null;
      }

      applyTextureSetRef.current(videoSet);
      setLoadedMedia('video');

      video.pause();
      video.srcObject = null;

      const isHls = HLS_EXTENSIONS.test(source);
      const canPlayNativeHls = Boolean(
        video.canPlayType('application/vnd.apple.mpegurl'),
      );

      if (isHls && !canPlayNativeHls && Hls.isSupported()) {
        // Chromium/Electron has no native HLS, so demux via hls.js.
        video.removeAttribute('src');
        const hls = new Hls();
        hlsRef.current = hls;
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setStatus(`Unable to load ${label} stream (HLS error).`);
          }
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.removeAttribute('src');
        video.src = source;
        video.load();
      }

      video.playbackRate = playbackRateRef.current;

      setTimelineCurrent(0);
      setTimelineDuration(0);
      setStatus(`Loading ${label} video...`);
    },
    [setLoadedMedia, teardownHls],
  );

  const setImageSource = React.useCallback(
    async (
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

        teardownHls();

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
    },
    [setLoadedMedia, teardownHls],
  );

  const nextItemId = React.useCallback((): string => {
    idCounterRef.current += 1;
    return `item-${idCounterRef.current}`;
  }, []);

  const buildItem = React.useCallback(
    (src: string, label: string, hint: MediaHint): PlaylistItem => ({
      id: nextItemId(),
      src,
      label,
      hint,
      persistable: PERSISTABLE_SOURCE.test(src),
    }),
    [nextItemId],
  );

  const buildItemFromFile = React.useCallback(
    (file: File): PlaylistItem => {
      const hint: MediaHint = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : mediaHint;
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(objectUrl);

      return {
        id: nextItemId(),
        src: objectUrl,
        label: file.name,
        hint,
        persistable: false,
      };
    },
    [mediaHint, nextItemId],
  );

  const addToRecents = React.useCallback((items: PlaylistItem[]): void => {
    const persistable = items.filter((item) => item.persistable);
    if (persistable.length === 0) {
      return;
    }

    setRecentItems((previous) => {
      const merged = [...persistable, ...previous];
      const seen = new Set<string>();
      const deduped: PlaylistItem[] = [];

      for (const item of merged) {
        if (seen.has(item.src)) {
          continue;
        }

        seen.add(item.src);
        deduped.push(item);
        if (deduped.length >= MAX_RECENT_ITEMS) {
          break;
        }
      }

      try {
        window.localStorage.setItem(
          RECENT_STORAGE_KEY,
          JSON.stringify(
            deduped.map(({ src, label, hint }) => ({ src, label, hint })),
          ),
        );
      } catch {
        // Ignore persistence errors (private mode / blocked storage).
      }

      return deduped;
    });
  }, []);

  const loadItemMedia = React.useCallback(
    (item: PlaylistItem): void => {
      const requestToken = ++loadTokenRef.current;
      if (item.persistable) {
        setSourceUrl(item.src);
      }

      // Auto-apply projection / stereo layout when the file name advertises it.
      const traits = detectMediaTraits(`${item.label} ${item.src}`);
      if (traits.projection) {
        setProjectionMode(traits.projection);
      }
      if (traits.stereo) {
        setStereoLayout(traits.stereo);
      }

      if (inferMediaType(item.src, item.hint) === 'image') {
        void setImageSource(item.src, requestToken, item.label);
        return;
      }

      setVideoSource(item.src, item.label);
    },
    [setImageSource, setVideoSource],
  );

  const goToIndex = React.useCallback(
    (index: number): void => {
      const list = playlistRef.current;
      if (index < 0 || index >= list.length) {
        return;
      }

      currentIndexRef.current = index;
      setCurrentIndex(index);
      loadItemMedia(list[index]);
    },
    [loadItemMedia],
  );

  const openItems = React.useCallback(
    (items: PlaylistItem[], replace = false): void => {
      if (items.length === 0) {
        return;
      }

      const baseList = replace ? [] : playlistRef.current;
      const nextList = [...baseList, ...items];
      const startIndex = baseList.length;

      playlistRef.current = nextList;
      setPlaylist(nextList);
      addToRecents(items);
      goToIndex(startIndex);
    },
    [addToRecents, goToIndex],
  );

  const playNext = React.useCallback((): void => {
    goToIndex(currentIndexRef.current + 1);
  }, [goToIndex]);

  const playPrevious = React.useCallback((): void => {
    goToIndex(currentIndexRef.current - 1);
  }, [goToIndex]);

  // Keep the "video ended" handler (set up inside the renderer effect) pointed
  // at the latest navigation logic so a finished clip advances the queue.
  React.useEffect(() => {
    autoAdvanceRef.current = (): void => {
      const index = currentIndexRef.current;
      if (index >= 0 && index < playlistRef.current.length - 1) {
        goToIndex(index + 1);
      }
    };
  }, [goToIndex]);

  const recenterView = React.useCallback((): void => {
    recenterViewRef.current();
    setStatus('View recentered.');
  }, []);

  const loadFromUrl = React.useCallback((): void => {
    const url = sourceUrl.trim();
    if (!url) {
      setStatus('Enter a media URL first.');
      return;
    }

    openItems([buildItem(url, url, mediaHint)]);
  }, [buildItem, mediaHint, openItems, sourceUrl]);

  React.useEffect(() => {
    if (!isDesktopApp || !window.electronAPI) {
      return;
    }

    const disposeFileListener = window.electronAPI.onMenuOpenFile((fileUrl) => {
      openItems([buildItem(fileUrl, fileUrl, 'auto')]);
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

        openItems([buildItem(nextUrl, nextUrl, mediaHint)]);
      })();
    });

    return () => {
      disposeFileListener();
      disposeUrlListener();
    };
  }, [buildItem, isDesktopApp, mediaHint, openItems, sourceUrl]);

  const loadFromFile = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = Array.from(event.target.files ?? []);
      if (files.length === 0) {
        return;
      }

      openItems(files.map((file) => buildItemFromFile(file)));
      // Allow re-selecting the same file(s) again later.
      event.target.value = '';
    },
    [buildItemFromFile, openItems],
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLElement>): void => {
      event.preventDefault();
    },
    [],
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLElement>): void => {
      event.preventDefault();

      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) {
        openItems(files.map((file) => buildItemFromFile(file)));
        return;
      }

      const text =
        event.dataTransfer?.getData('text/uri-list') ||
        event.dataTransfer?.getData('text/plain');
      const url = text?.trim();
      if (url) {
        openItems([buildItem(url, url, mediaHint)]);
      }
    },
    [buildItem, buildItemFromFile, mediaHint, openItems],
  );

  const selectPlaylistItem = React.useCallback(
    (id: string): void => {
      const index = playlistRef.current.findIndex((item) => item.id === id);
      if (index >= 0) {
        goToIndex(index);
      }
    },
    [goToIndex],
  );

  const selectRecentItem = React.useCallback(
    (item: PlaylistItem): void => {
      openItems([buildItem(item.src, item.label, item.hint)]);
    },
    [buildItem, openItems],
  );

  const clearRecents = React.useCallback((): void => {
    setRecentItems([]);
    try {
      window.localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch {
      // Ignore persistence errors.
    }
  }, []);

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
        return;
      }

      if (event.key === 'c' || event.key === 'C') {
        event.preventDefault();
        recenterView();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [adjustVolumeByStep, recenterView, seekBySeconds, togglePlayback]);

  const canPlayPrevious = currentIndex > 0;
  const canPlayNext = currentIndex >= 0 && currentIndex < playlist.length - 1;

  return (
    <>
      <GlobalStyle />
      <PlayerRoot
        $immersive={isImmersive}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <PlayerViewer
          shellRef={playerShellRef}
          mountRef={mountRef}
          isFullscreen={isImmersive}
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
              isFullscreen={isWindowedFullscreen}
              volume={volume}
              playbackRate={playbackRate}
              playbackRateOptions={PLAYBACK_RATE_OPTIONS}
              isLooping={isLooping}
              playlist={playlist}
              currentIndex={currentIndex}
              canPlayPrevious={canPlayPrevious}
              canPlayNext={canPlayNext}
              recentItems={recentItems}
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
              onPlaybackRateChange={setPlaybackRate}
              onLoopChange={setIsLooping}
              onRecenter={recenterView}
              onPlayPrevious={playPrevious}
              onPlayNext={playNext}
              onSelectPlaylistItem={selectPlaylistItem}
              onSelectRecentItem={selectRecentItem}
              onClearRecents={clearRecents}
            />
          }
        />
      </PlayerRoot>
    </>
  );
};

export default Main;
