import * as React from "react";

import { ViewerCanvas, ViewerControlsWrap, ViewerPanel } from "./playerStyles";

type PlayerViewerProps = {
  shellRef?: React.RefObject<HTMLElement | null>;
  mountRef: React.RefObject<HTMLDivElement | null>;
  controls?: React.ReactNode;
};

const PlayerViewer: React.FC<PlayerViewerProps> = ({
  shellRef,
  mountRef,
  controls,
}) => {
  return (
    <ViewerPanel ref={shellRef as React.RefObject<HTMLDivElement>}>
      <ViewerCanvas ref={mountRef} />
      {controls ? <ViewerControlsWrap>{controls}</ViewerControlsWrap> : null}
    </ViewerPanel>
  );
};

export default PlayerViewer;
