export type MediaHint = "auto" | "video" | "image";
export type LoadedMedia = "video" | "image" | null;
export type StereoLayout = "mono" | "left-right" | "top-bottom";
export type ProjectionMode = "360" | "180";

export type PlaylistItem = {
  id: string;
  src: string;
  label: string;
  hint: MediaHint;
  // Whether the source survives an app restart (http(s)/file URLs do; ephemeral
  // blob: object URLs from local file drops do not, so they are kept out of the
  // persisted "recent" list).
  persistable: boolean;
};
