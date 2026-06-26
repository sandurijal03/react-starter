import * as React from 'react';

import {
  BufferingSpinner,
  CaptionOverlay,
  ViewerCanvas,
  ViewerControlsWrap,
  ViewerPanel,
} from '../styles/playerStyles';

type PlayerViewerProps = {
  shellRef?: React.RefObject<HTMLElement | null>;
  mountRef: React.RefObject<HTMLDivElement | null>;
  controls?: React.ReactNode;
  isFullscreen?: boolean;
  isBuffering?: boolean;
  caption?: string;
};

// How long the controls stay visible after the last pointer activity before
// they fade out in fullscreen.
const CONTROLS_IDLE_TIMEOUT_MS = 2500;

const PlayerViewer: React.FC<PlayerViewerProps> = ({
  shellRef,
  mountRef,
  controls,
  isFullscreen = false,
  isBuffering = false,
  caption = '',
}) => {
  const [showFloatingControls, setShowFloatingControls] =
    React.useState<boolean>(true);
  const hideTimerRef = React.useRef<number | null>(null);

  const clearHideTimer = React.useCallback((): void => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // Hide purely on inactivity: the bar fades out a fixed delay after the last
  // pointer movement, no matter where the cursor rests (including on the bar
  // itself). Any movement brings it back.
  const scheduleHide = React.useCallback((): void => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
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

  const showControls = !isFullscreen || showFloatingControls;

  return (
    <ViewerPanel
      ref={shellRef as React.RefObject<HTMLDivElement>}
      $isFullscreen={isFullscreen}
      $hideCursor={isFullscreen && !showControls}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      <ViewerCanvas ref={mountRef} $isFullscreen={isFullscreen} />
      {isBuffering ? <BufferingSpinner aria-label="Buffering" /> : null}
      {caption ? <CaptionOverlay>{caption}</CaptionOverlay> : null}
      {controls ? (
        <ViewerControlsWrap
          $floating={isFullscreen}
          $visible={showControls}
          aria-hidden={!showControls}
        >
          {controls}
        </ViewerControlsWrap>
      ) : null}
    </ViewerPanel>
  );
};

export default PlayerViewer;
