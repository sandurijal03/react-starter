import * as React from "react";

import {
  CheckboxInput,
  CompactSelect,
  CompactToolbar,
  CompactVolumeSlider,
  ControlsPanel,
  HiddenFileInput,
  IconButton,
  IconFileLabel,
  MenuPopover,
  MenuPopoverButton,
  MenuPopoverPanel,
  MenuToggle,
  MiniButton,
  PopoverDivider,
  PopoverEmpty,
  PopoverList,
  PopoverListButton,
  PopoverRow,
  PopoverText,
  PopoverTitle,
  StatusSubtle,
  StatusText,
  StyledSelect,
  TimelineRow,
  TimelineSlider,
  TimelineText,
  ToolbarGroup,
  UrlInput,
  VolumeSlider,
} from "../styles/playerStyles";
import {
  MediaHint,
  LoadedMedia,
  PlaylistItem,
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
  playbackRate: number;
  playbackRateOptions: number[];
  isLooping: boolean;
  playlist: PlaylistItem[];
  currentIndex: number;
  canPlayPrevious: boolean;
  canPlayNext: boolean;
  recentItems: PlaylistItem[];
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
  onPlaybackRateChange: (value: number) => void;
  onLoopChange: (value: boolean) => void;
  onRecenter: () => void;
  onPlayPrevious: () => void;
  onPlayNext: () => void;
  onSelectPlaylistItem: (id: string) => void;
  onSelectRecentItem: (item: PlaylistItem) => void;
  onClearRecents: () => void;
};

type ToolbarIconName =
  | "file"
  | "link"
  | "view"
  | "stereo"
  | "play"
  | "pause"
  | "mute"
  | "unmute"
  | "fullscreen"
  | "exit-fullscreen"
  | "previous"
  | "next"
  | "library";

const ToolbarIcon: React.FC<{ name: ToolbarIconName }> = ({ name }) => {
  switch (name) {
    case "file":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 2h8l5 5v15H6V2zm8 1.5V8h4.5" />
          <path d="M9 12h6v1.7H9zm0 3.2h6v1.7H9z" />
        </svg>
      );
    case "link":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9.8 14.2l-1.2 1.2a3 3 0 01-4.2-4.2l3.4-3.4A3 3 0 0112 8.6l-1.2 1.2a1.3 1.3 0 00-1.8 0l-3.4 3.4a1.3 1.3 0 101.8 1.8l1.2-1.2z" />
          <path d="M14.2 9.8l1.2-1.2a3 3 0 114.2 4.2l-3.4 3.4a3 3 0 01-4.2-.8l1.2-1.2a1.3 1.3 0 001.8 0l3.4-3.4a1.3 1.3 0 00-1.8-1.8l-1.2 1.2z" />
        </svg>
      );
    case "view":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 6h18v2H3zm0 10h18v2H3zM7 11h10v2H7z" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="7" r="2" />
          <circle cx="14" cy="17" r="2" />
        </svg>
      );
    case "stereo":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 4h8v16H3zm10 0h8v16h-8z" />
          <path d="M8 7H6v10h2zm10 0h-2v10h2z" fill="#17191d" />
        </svg>
      );
    case "pause":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 4h5v16H6zm7 0h5v16h-5z" />
        </svg>
      );
    case "mute":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 10h4l5-4v12l-5-4H3z" />
          <path
            d="M16 9l5 6m0-6l-5 6"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case "unmute":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 10h4l5-4v12l-5-4H3z" />
          <path
            d="M16 9a4 4 0 010 6m2-8a7 7 0 010 10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case "fullscreen":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 9V4h5v2H6v3zm10-5h5v5h-2V6h-3zM4 15h2v3h3v2H4zm13 0h2v5h-5v-2h3z" />
        </svg>
      );
    case "exit-fullscreen":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9 4v2H6v3H4V4zm11 0v5h-2V6h-3V4zM4 15h2v3h3v2H4zm14 0h2v5h-5v-2h3z" />
          <path d="M9 9h6v6H9z" />
        </svg>
      );
    case "previous":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M7 5h2v14H7zm3 7l9 7V5z" />
        </svg>
      );
    case "next":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M15 5h2v14h-2zM5 5l9 7-9 7z" />
        </svg>
      );
    case "library":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 5h12v2H3zm0 4h12v2H3zm0 4h8v2H3z" />
          <path d="M17 9l5 3.5-5 3.5z" />
        </svg>
      );
    case "play":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
  }
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
  playbackRate,
  playbackRateOptions,
  isLooping,
  playlist,
  currentIndex,
  canPlayPrevious,
  canPlayNext,
  recentItems,
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
  onPlaybackRateChange,
  onLoopChange,
  onRecenter,
  onPlayPrevious,
  onPlayNext,
  onSelectPlaylistItem,
  onSelectRecentItem,
  onClearRecents,
}) => {
  return (
    <ControlsPanel $insidePlayer={insidePlayer}>
      <CompactToolbar>
        <ToolbarGroup>
          <CompactSelect
            id="media-hint"
            aria-label="Media type"
            value={mediaHint}
            onChange={(event) =>
              onMediaHintChange(event.target.value as MediaHint)
            }
          >
            <option value="auto">Auto</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
          </CompactSelect>
          {showSourceInputs ? (
            <>
              <IconFileLabel htmlFor="video-file" title="Load local file">
                <ToolbarIcon name="file" />
              </IconFileLabel>
              <HiddenFileInput
                id="video-file"
                type="file"
                accept="video/*,image/*"
                multiple
                onChange={onLoadFile}
              />
              <MenuPopover>
                <MenuPopoverButton
                  aria-label="Open source URL controls"
                  title="Source URL"
                >
                  <ToolbarIcon name="link" />
                </MenuPopoverButton>
                <MenuPopoverPanel>
                  <PopoverTitle>Media URL</PopoverTitle>
                  <PopoverRow>
                    <UrlInput
                      id="media-url"
                      type="url"
                      placeholder="https://example.com/360-video.mp4"
                      value={sourceUrl}
                      onChange={(event) =>
                        onSourceUrlChange(event.target.value)
                      }
                    />
                    <MiniButton type="button" onClick={onLoadUrl}>
                      Load
                    </MiniButton>
                  </PopoverRow>
                </MenuPopoverPanel>
              </MenuPopover>
            </>
          ) : null}
        </ToolbarGroup>

        <ToolbarGroup>
          <IconButton
            type="button"
            onClick={onPlayPrevious}
            disabled={!canPlayPrevious}
            title="Previous"
            aria-label="Previous"
          >
            <ToolbarIcon name="previous" />
          </IconButton>
          <IconButton
            type="button"
            onClick={onTogglePlayback}
            disabled={loadedMedia !== "video"}
            title={isPlaying ? "Pause" : "Play"}
            aria-label={isPlaying ? "Pause" : "Play"}
            $active={isPlaying}
          >
            <ToolbarIcon name={isPlaying ? "pause" : "play"} />
          </IconButton>
          <IconButton
            type="button"
            onClick={onPlayNext}
            disabled={!canPlayNext}
            title="Next"
            aria-label="Next"
          >
            <ToolbarIcon name="next" />
          </IconButton>
          <IconButton
            type="button"
            onClick={onToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute" : "Mute"}
            $active={isMuted}
          >
            <ToolbarIcon name={isMuted ? "mute" : "unmute"} />
          </IconButton>
          <IconButton
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            $active={isFullscreen}
          >
            <ToolbarIcon
              name={isFullscreen ? "exit-fullscreen" : "fullscreen"}
            />
          </IconButton>
          <CompactVolumeSlider
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={onVolumeChange}
            aria-label="Volume"
          />
          <CompactSelect
            id="playback-rate"
            aria-label="Playback speed"
            title="Playback speed"
            value={String(playbackRate)}
            disabled={loadedMedia !== "video"}
            onChange={(event) =>
              onPlaybackRateChange(Number(event.target.value))
            }
          >
            {playbackRateOptions.map((rate) => (
              <option key={rate} value={rate}>
                {rate}&times;
              </option>
            ))}
          </CompactSelect>
        </ToolbarGroup>

        <ToolbarGroup>
          <MenuPopover>
            <MenuPopoverButton
              aria-label="Open view controls"
              title="View controls"
              $active={vrModeEnabled}
            >
              <ToolbarIcon name="view" />
            </MenuPopoverButton>
            <MenuPopoverPanel>
              <PopoverTitle>View</PopoverTitle>
              <PopoverRow>
                <PopoverText>Projection</PopoverText>
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
              </PopoverRow>
              <PopoverRow>
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
              </PopoverRow>
              <PopoverRow>
                <MenuToggle htmlFor="loop-enabled">
                  <CheckboxInput
                    id="loop-enabled"
                    type="checkbox"
                    checked={isLooping}
                    onChange={(event) => onLoopChange(event.target.checked)}
                  />
                  Loop
                </MenuToggle>
              </PopoverRow>
              <PopoverRow>
                <PopoverText>Crop</PopoverText>
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
                  aria-label="Crop threshold"
                />
                <TimelineText>
                  {Math.round(fitMismatchThreshold * 100)}%
                </TimelineText>
              </PopoverRow>
              <PopoverRow>
                <MiniButton type="button" onClick={onRecenter}>
                  Recenter view (C)
                </MiniButton>
              </PopoverRow>
            </MenuPopoverPanel>
          </MenuPopover>

          <MenuPopover>
            <MenuPopoverButton
              aria-label="Open stereo controls"
              title="Stereo controls"
              $active={stereoLayout !== "mono" || swapEyes}
            >
              <ToolbarIcon name="stereo" />
            </MenuPopoverButton>
            <MenuPopoverPanel>
              <PopoverTitle>Stereo</PopoverTitle>
              <PopoverRow>
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
              </PopoverRow>
              <PopoverRow>
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
              </PopoverRow>
            </MenuPopoverPanel>
          </MenuPopover>

          <MenuPopover>
            <MenuPopoverButton
              aria-label="Open playlist and recent media"
              title="Playlist & recent"
              $active={playlist.length > 0}
            >
              <ToolbarIcon name="library" />
            </MenuPopoverButton>
            <MenuPopoverPanel>
              <PopoverTitle>Playlist</PopoverTitle>
              {playlist.length === 0 ? (
                <PopoverEmpty>
                  Queue is empty. Open or drop media to add.
                </PopoverEmpty>
              ) : (
                <PopoverList>
                  {playlist.map((item, index) => (
                    <PopoverListButton
                      key={item.id}
                      type="button"
                      $active={index === currentIndex}
                      title={item.label}
                      onClick={() => onSelectPlaylistItem(item.id)}
                    >
                      <span>{`${index + 1}. ${item.label}`}</span>
                    </PopoverListButton>
                  ))}
                </PopoverList>
              )}

              <PopoverDivider />

              <PopoverTitle>Recent</PopoverTitle>
              {recentItems.length === 0 ? (
                <PopoverEmpty>No recent media yet.</PopoverEmpty>
              ) : (
                <>
                  <PopoverList>
                    {recentItems.map((item) => (
                      <PopoverListButton
                        key={item.id}
                        type="button"
                        title={item.src}
                        onClick={() => onSelectRecentItem(item)}
                      >
                        <span>{item.label}</span>
                      </PopoverListButton>
                    ))}
                  </PopoverList>
                  <PopoverRow>
                    <MiniButton type="button" onClick={onClearRecents}>
                      Clear recent
                    </MiniButton>
                  </PopoverRow>
                </>
              )}
            </MenuPopoverPanel>
          </MenuPopover>
        </ToolbarGroup>
      </CompactToolbar>

      {!showSourceInputs ? (
        <StatusSubtle>
          Use File menu for Open File and Open Media URL.
        </StatusSubtle>
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
