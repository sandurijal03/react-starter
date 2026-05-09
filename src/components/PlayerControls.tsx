import * as React from "react";

import {
  CheckboxInput,
  ControlButton,
  ControlsPanel,
  FileButton,
  HiddenFileInput,
  InputRow,
  MenuInlineRow,
  MenuSection,
  MenuSectionTitle,
  MenuToggle,
  PlayerMenuBar,
  StatusSubtle,
  StatusText,
  StyledSelect,
  TimelineRow,
  TimelineSlider,
  TimelineText,
  UrlInput,
  VolumeControl,
  VolumeSlider,
} from "./playerStyles";
import {
  MediaHint,
  LoadedMedia,
  ProjectionMode,
  StereoLayout,
} from "../types/player";

type PlayerControlsProps = {
  insidePlayer?: boolean;
  showSourceInputs?: boolean;
  mediaHint: MediaHint;
  projectionMode: ProjectionMode;
  fitMismatchThreshold: number;
  vrModeEnabled: boolean;
  stereoLayout: StereoLayout;
  swapEyes: boolean;
  sourceUrl: string;
  loadedMedia: LoadedMedia;
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  volume: number;
  timelineCurrent: number;
  timelineDuration: number;
  timelineLabel: string;
  status: string;
  xrSupported: boolean | null;
  onMediaHintChange: (value: MediaHint) => void;
  onProjectionModeChange: (value: ProjectionMode) => void;
  onFitMismatchThresholdChange: (value: number) => void;
  onVrModeEnabledChange: (value: boolean) => void;
  onStereoLayoutChange: (value: StereoLayout) => void;
  onSwapEyesChange: (value: boolean) => void;
  onSourceUrlChange: (value: string) => void;
  onLoadUrl: () => void;
  onLoadFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSeekChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  insidePlayer = false,
  showSourceInputs = true,
  mediaHint,
  projectionMode,
  fitMismatchThreshold,
  vrModeEnabled,
  stereoLayout,
  swapEyes,
  sourceUrl,
  loadedMedia,
  isPlaying,
  isMuted,
  isFullscreen,
  volume,
  timelineCurrent,
  timelineDuration,
  timelineLabel,
  status,
  xrSupported,
  onMediaHintChange,
  onProjectionModeChange,
  onFitMismatchThresholdChange,
  onVrModeEnabledChange,
  onStereoLayoutChange,
  onSwapEyesChange,
  onSourceUrlChange,
  onLoadUrl,
  onLoadFile,
  onTogglePlayback,
  onToggleMute,
  onToggleFullscreen,
  onVolumeChange,
  onSeekChange,
}) => {
  return (
    <ControlsPanel $insidePlayer={insidePlayer}>
      <PlayerMenuBar>
        <MenuSection>
          <MenuSectionTitle>Media</MenuSectionTitle>
          <MenuInlineRow>
            <StyledSelect
              id="media-hint"
              aria-label="Media type"
              value={mediaHint}
              onChange={(event) =>
                onMediaHintChange(event.target.value as MediaHint)
              }
            >
              <option value="auto">Auto detect</option>
              <option value="video">Video</option>
              <option value="image">Image panorama</option>
            </StyledSelect>
            {showSourceInputs ? (
              <>
                <FileButton htmlFor="video-file">Load Local File</FileButton>
                <HiddenFileInput
                  id="video-file"
                  type="file"
                  accept="video/*,image/*"
                  onChange={onLoadFile}
                />
              </>
            ) : null}
          </MenuInlineRow>
          {!showSourceInputs ? (
            <StatusSubtle>
              Use File menu for Open File and Open Media URL.
            </StatusSubtle>
          ) : null}
        </MenuSection>

        <MenuSection>
          <MenuSectionTitle>View</MenuSectionTitle>
          <MenuInlineRow>
            <StyledSelect
              id="projection-mode"
              aria-label="Projection mode"
              value={projectionMode}
              onChange={(event) =>
                onProjectionModeChange(event.target.value as ProjectionMode)
              }
            >
              <option value="360">360</option>
              <option value="180">180</option>
            </StyledSelect>
            <ControlButton type="button" onClick={onToggleFullscreen}>
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </ControlButton>
            <MenuToggle htmlFor="vr-mode-enabled">
              <CheckboxInput
                id="vr-mode-enabled"
                type="checkbox"
                checked={vrModeEnabled}
                onChange={(event) =>
                  onVrModeEnabledChange(event.target.checked)
                }
              />
              Enable VR mode
            </MenuToggle>
          </MenuInlineRow>
          <MenuInlineRow>
            <MenuToggle htmlFor="fit-threshold-slider">
              Crop Threshold
            </MenuToggle>
            <VolumeSlider
              id="fit-threshold-slider"
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={fitMismatchThreshold}
              onChange={(event) =>
                onFitMismatchThresholdChange(Number(event.target.value))
              }
            />
            <TimelineText>
              {Math.round(fitMismatchThreshold * 100)}%
            </TimelineText>
          </MenuInlineRow>
        </MenuSection>

        <MenuSection>
          <MenuSectionTitle>Stereo</MenuSectionTitle>
          <MenuInlineRow>
            <StyledSelect
              id="stereo-layout"
              aria-label="Stereo layout"
              value={stereoLayout}
              disabled={!vrModeEnabled}
              onChange={(event) =>
                onStereoLayoutChange(event.target.value as StereoLayout)
              }
            >
              <option value="mono">Mono</option>
              <option value="left-right">Left-Right (SBS)</option>
              <option value="top-bottom">Top-Bottom (OU)</option>
            </StyledSelect>
            <MenuToggle htmlFor="swap-eyes">
              <CheckboxInput
                id="swap-eyes"
                type="checkbox"
                checked={swapEyes}
                disabled={!vrModeEnabled || stereoLayout === "mono"}
                onChange={(event) => onSwapEyesChange(event.target.checked)}
              />
              Swap Eyes
            </MenuToggle>
          </MenuInlineRow>
        </MenuSection>

        <MenuSection>
          <MenuSectionTitle>Playback</MenuSectionTitle>
          <MenuInlineRow>
            <ControlButton
              type="button"
              onClick={onTogglePlayback}
              disabled={loadedMedia !== "video"}
            >
              {isPlaying ? "Pause" : "Play"}
            </ControlButton>
            <ControlButton type="button" onClick={onToggleMute}>
              {isMuted ? "Unmute" : "Mute"}
            </ControlButton>
            <VolumeControl htmlFor="volume-slider">
              Volume
              <VolumeSlider
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={onVolumeChange}
              />
            </VolumeControl>
          </MenuInlineRow>
        </MenuSection>
      </PlayerMenuBar>

      {showSourceInputs ? (
        <>
          <label htmlFor="media-url">Media URL</label>
          <InputRow>
            <UrlInput
              id="media-url"
              type="url"
              placeholder="https://example.com/360-video.mp4"
              value={sourceUrl}
              onChange={(event) => onSourceUrlChange(event.target.value)}
            />
            <ControlButton type="button" onClick={onLoadUrl}>
              Load URL
            </ControlButton>
          </InputRow>
        </>
      ) : null}

      <TimelineRow>
        <label htmlFor="timeline-slider">Timeline</label>
        <TimelineSlider
          id="timeline-slider"
          type="range"
          min="0"
          max={timelineDuration > 0 ? timelineDuration : 0}
          step="0.01"
          value={Math.min(timelineCurrent, timelineDuration || 0)}
          onChange={onSeekChange}
          disabled={loadedMedia !== "video" || timelineDuration <= 0}
        />
        <TimelineText>{timelineLabel}</TimelineText>
      </TimelineRow>

      <StatusText>{status}</StatusText>
      <StatusSubtle>Loaded media: {loadedMedia ?? "none"}</StatusSubtle>
      <StatusSubtle>
        WebXR support:{" "}
        {xrSupported === null ? "checking..." : xrSupported ? "yes" : "no"}
      </StatusSubtle>
    </ControlsPanel>
  );
};

export default PlayerControls;
