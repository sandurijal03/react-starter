import { MediaHint, PlaylistItem, StereoLayout } from '../types/player';

export const VR_MODE_STORAGE_KEY = 'vr_player_vr_mode';
export const LOOP_STORAGE_KEY = 'vr_player_loop';
export const STEREO_LAYOUT_STORAGE_KEY = 'vr_player_stereo_layout';
export const FIT_THRESHOLD_STORAGE_KEY = 'vr_player_fit_threshold';
export const RECENT_STORAGE_KEY = 'vr_player_recent_media';

export const MIN_FIT_THRESHOLD = 0.05;
export const MAX_FIT_THRESHOLD = 0.5;
export const DEFAULT_FIT_THRESHOLD = 0.22;
export const MAX_RECENT_ITEMS = 12;

export const clampFitThreshold = (value: number): number =>
  Math.min(MAX_FIT_THRESHOLD, Math.max(MIN_FIT_THRESHOLD, value));

export const readStoredFitThreshold = (): number => {
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

export const isStereoLayout = (value: string): value is StereoLayout =>
  value === 'mono' || value === 'left-right' || value === 'top-bottom';

export const readStoredStereoLayout = (): StereoLayout => {
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

export const readStoredVrModeEnabled = (): boolean => {
  try {
    const stored = window.localStorage.getItem(VR_MODE_STORAGE_KEY);
    return stored === 'true' || stored === '1';
  } catch {
    return false;
  }
};

export const readStoredLooping = (): boolean => {
  try {
    const stored = window.localStorage.getItem(LOOP_STORAGE_KEY);
    // Default to looping (the historical behaviour) when nothing is stored.
    return stored === null ? true : stored === 'true' || stored === '1';
  } catch {
    return true;
  }
};

const isMediaHint = (value: unknown): value is MediaHint =>
  value === 'auto' || value === 'video' || value === 'image';

export const readStoredRecentItems = (): PlaylistItem[] => {
  try {
    const stored = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry): entry is { src: string; label: string; hint: MediaHint } =>
          Boolean(entry) &&
          typeof entry === 'object' &&
          typeof (entry as { src?: unknown }).src === 'string' &&
          typeof (entry as { label?: unknown }).label === 'string' &&
          isMediaHint((entry as { hint?: unknown }).hint),
      )
      .slice(0, MAX_RECENT_ITEMS)
      .map((entry, index) => ({
        id: `recent-${index}-${entry.src}`,
        src: entry.src,
        label: entry.label,
        hint: entry.hint,
        persistable: true,
      }));
  } catch {
    return [];
  }
};
