import * as React from 'react';

import { ViewerCanvas, ViewerControlsWrap, ViewerPanel } from './playerStyles';

type PlayerViewerProps = {
  shellRef?: React.RefObject<HTMLElement | null>;
  mountRef: React.RefObject<HTMLDivElement | null>;
  controls?: React.ReactNode;
  isFullscreen?: boolean;
};

// How long the controls stay visible after the last pointer activity before
// they fade out in fullscreen.
const CONTROLS_IDLE_TIMEOUT_MS = 2500;

const PlayerViewer: React.FC<PlayerViewerProps> = ({
  shellRef,
  mountRef,
  controls,
  isFullscreen = false,
}) => {
  const [showFloatingControls, setShowFloatingControls] =
    React.useState<boolean>(true);
  const hideTimerRef = React.useRef<number | null>(null);
  const pointerOverControlsRef = React.useRef<boolean>(false);

  const clearHideTimer = React.useCallback((): void => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = React.useCallback((): void => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      // Never hide while the pointer is resting on the control bar itself.
      if (pointerOverControlsRef.current) {
        return;
      }

      setShowFloatingControls(false);
    }, CONTROLS_IDLE_TIMEOUT_MS);
  }, [clearHideTimer]);

  // Entering fullscreen: show the controls briefly, then fade them out once the
  // pointer goes idle. Leaving fullscreen: keep them docked and always visible.
  React.useEffect(() => {
    if (!isFullscreen) {
      clearHideTimer();
      setShowFloatingControls(true);
      return;
    }

    setShowFloatingControls(true);
    scheduleHide();

    return () => {
      clearHideTimer();
    };
  }, [isFullscreen, clearHideTimer, scheduleHide]);

  const revealControls = React.useCallback((): void => {
    if (!isFullscreen) {
      return;
    }

    setShowFloatingControls(true);
    scheduleHide();
  }, [isFullscreen, scheduleHide]);

  const onViewerMouseMove = (): void => {
    revealControls();
  };

  const onViewerTouchStart = (): void => {
    revealControls();
  };

  const onControlsPointerEnter = (): void => {
    pointerOverControlsRef.current = true;

    if (isFullscreen) {
      clearHideTimer();
      setShowFloatingControls(true);
    }
  };

  const onControlsPointerLeave = (): void => {
    pointerOverControlsRef.current = false;

    if (isFullscreen) {
      scheduleHide();
    }
  };

  const showControls = !isFullscreen || showFloatingControls;

  return (
    <ViewerPanel
      ref={shellRef as React.RefObject<HTMLDivElement>}
      $isFullscreen={isFullscreen}
      $hideCursor={isFullscreen && !showControls}
      onMouseMove={onViewerMouseMove}
      onTouchStart={onViewerTouchStart}
    >
      <ViewerCanvas ref={mountRef} $isFullscreen={isFullscreen} />
      {controls ? (
        <ViewerControlsWrap
          $floating={isFullscreen}
          $visible={showControls}
          aria-hidden={!showControls}
          onMouseEnter={onControlsPointerEnter}
          onMouseLeave={onControlsPointerLeave}
        >
          {controls}
        </ViewerControlsWrap>
      ) : null}
    </ViewerPanel>
  );
};

export default PlayerViewer;
