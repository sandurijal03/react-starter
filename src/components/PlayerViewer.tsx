import * as React from 'react';

import { ViewerCanvas, ViewerControlsWrap, ViewerPanel } from './playerStyles';

type PlayerViewerProps = {
  shellRef?: React.RefObject<HTMLElement | null>;
  mountRef: React.RefObject<HTMLDivElement | null>;
  controls?: React.ReactNode;
  isFullscreen?: boolean;
  controlsAutoHideMs?: number;
};

const PlayerViewer: React.FC<PlayerViewerProps> = ({
  shellRef,
  mountRef,
  controls,
  isFullscreen = false,
  controlsAutoHideMs = 2200,
}) => {
  const [showControlsInFullscreen, setShowControlsInFullscreen] =
    React.useState<boolean>(true);
  const hideTimerRef = React.useRef<number | null>(null);

  const clearHideTimer = React.useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = React.useCallback(() => {
    clearHideTimer();

    if (!isFullscreen) {
      return;
    }

    hideTimerRef.current = window.setTimeout(() => {
      setShowControlsInFullscreen(false);
      hideTimerRef.current = null;
    }, controlsAutoHideMs);
  }, [clearHideTimer, controlsAutoHideMs, isFullscreen]);

  React.useEffect(() => {
    if (!isFullscreen) {
      clearHideTimer();
      setShowControlsInFullscreen(true);
      return;
    }

    setShowControlsInFullscreen(true);
    scheduleHideControls();
  }, [clearHideTimer, isFullscreen, scheduleHideControls]);

  React.useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  const onViewerActivity = React.useCallback(() => {
    if (!isFullscreen) {
      return;
    }

    setShowControlsInFullscreen(true);
    scheduleHideControls();
  }, [isFullscreen, scheduleHideControls]);

  const shouldShowControls = !isFullscreen || showControlsInFullscreen;

  return (
    <ViewerPanel
      ref={shellRef as React.RefObject<HTMLDivElement>}
      onMouseMove={onViewerActivity}
      onTouchStart={onViewerActivity}
    >
      <ViewerCanvas ref={mountRef} />
      {controls && shouldShowControls ? (
        <ViewerControlsWrap>{controls}</ViewerControlsWrap>
      ) : null}
    </ViewerPanel>
  );
};

export default PlayerViewer;
