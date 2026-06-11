import * as React from 'react';

import { ViewerCanvas, ViewerControlsWrap, ViewerPanel } from './playerStyles';

type PlayerViewerProps = {
  shellRef?: React.RefObject<HTMLElement | null>;
  mountRef: React.RefObject<HTMLDivElement | null>;
  controls?: React.ReactNode;
  isFullscreen?: boolean;
};

const PlayerViewer: React.FC<PlayerViewerProps> = ({
  shellRef,
  mountRef,
  controls,
  isFullscreen = false,
}) => {
  const [showFloatingControls, setShowFloatingControls] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isFullscreen) {
      setShowFloatingControls(true);
      return;
    }

    setShowFloatingControls(false);
  }, [isFullscreen]);

  const onViewerMouseMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (!isFullscreen) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const activationBandHeight = Math.min(180, rect.height * 0.3);
    const shouldShow = event.clientY >= rect.bottom - activationBandHeight;
    setShowFloatingControls(shouldShow);
  };

  const onViewerMouseLeave = (): void => {
    if (!isFullscreen) {
      return;
    }

    setShowFloatingControls(false);
  };

  const onViewerTouchStart = (): void => {
    if (!isFullscreen) {
      return;
    }

    setShowFloatingControls(true);
  };

  const showControls = !isFullscreen || showFloatingControls;

  return (
    <ViewerPanel
      ref={shellRef as React.RefObject<HTMLDivElement>}
      $isFullscreen={isFullscreen}
      onMouseMove={onViewerMouseMove}
      onMouseLeave={onViewerMouseLeave}
      onTouchStart={onViewerTouchStart}
    >
      <ViewerCanvas ref={mountRef} $isFullscreen={isFullscreen} />
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
