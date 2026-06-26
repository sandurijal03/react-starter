import { LoadedMedia, MediaHint, ProjectionMode, StereoLayout } from '../types/player';

export const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|bmp|gif)(\?.*)?$/i;
export const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv|m3u8)(\?.*)?$/i;
export const HLS_EXTENSIONS = /\.m3u8(\?.*)?$/i;
export const PERSISTABLE_SOURCE = /^(https?|file):/i;

export const inferMediaType = (
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

// Best-effort detection of projection / stereo layout from a file name or URL,
// using the conventions panoramic media is usually tagged with (e.g.
// "clip_180_TB.mp4", "beach-360-sbs.jpg"). Only returns fields it is confident
// about so the user's current settings are left untouched otherwise.
export const detectMediaTraits = (
  value: string,
): { projection?: ProjectionMode; stereo?: StereoLayout } => {
  const name = value.toLowerCase();
  const traits: { projection?: ProjectionMode; stereo?: StereoLayout } = {};

  if (/(^|[^0-9])180([^0-9]|$)/.test(name)) {
    traits.projection = '180';
  } else if (/(^|[^0-9])360([^0-9]|$)/.test(name)) {
    traits.projection = '360';
  }

  if (/(\b|_|-)(tb|ou|top[-_]?bottom|over[-_]?under)(\b|_|-|\.)/.test(name)) {
    traits.stereo = 'top-bottom';
  } else if (
    /(\b|_|-)(sbs|lr|left[-_]?right|side[-_]?by[-_]?side|3dh)(\b|_|-|\.)/.test(
      name,
    )
  ) {
    traits.stereo = 'left-right';
  }

  return traits;
};
