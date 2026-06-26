import * as THREE from 'three';

import { ProjectionMode, StereoLayout } from '../types/player';

export type TextureSet = {
  base: THREE.Texture;
  left: THREE.Texture;
  right: THREE.Texture;
  isVideo: boolean;
};

export const createProjectionGeometry = (
  mode: ProjectionMode,
): THREE.SphereGeometry => {
  const geometry =
    mode === '180'
      ? new THREE.SphereGeometry(500, 72, 48, -Math.PI / 2, Math.PI)
      : new THREE.SphereGeometry(500, 72, 48);

  geometry.scale(-1, 1, 1);
  return geometry;
};

export const cloneTexture = (source: THREE.Texture): THREE.Texture => {
  const clone = source.clone();
  clone.needsUpdate = true;
  return clone;
};

export const createTextureSet = (
  base: THREE.Texture,
  isVideo: boolean,
): TextureSet => {
  return {
    base,
    left: cloneTexture(base),
    right: cloneTexture(base),
    isVideo,
  };
};

export const disposeTextureSet = (set: TextureSet | null): void => {
  if (!set) {
    return;
  }

  set.base.dispose();
  set.left.dispose();
  set.right.dispose();
};

export const applyStereoLayoutToTextureSet = (
  layout: StereoLayout,
  set: TextureSet,
  swapEyes: boolean,
): void => {
  const targets = [set.left, set.right];

  for (const texture of targets) {
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.needsUpdate = true;
  }

  if (layout === 'left-right') {
    set.left.repeat.set(0.5, 1);
    set.left.offset.set(swapEyes ? 0.5 : 0, 0);
    set.right.repeat.set(0.5, 1);
    set.right.offset.set(swapEyes ? 0 : 0.5, 0);
  }

  if (layout === 'top-bottom') {
    set.left.repeat.set(1, 0.5);
    set.left.offset.set(0, swapEyes ? 0 : 0.5);
    set.right.repeat.set(1, 0.5);
    set.right.offset.set(0, swapEyes ? 0.5 : 0);
  }

  set.left.needsUpdate = true;
  set.right.needsUpdate = true;
};
