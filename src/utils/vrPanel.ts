import { formatTime } from './format';

// The in-headset control panel is drawn to a 2D canvas and shown on a plane in
// the WebXR scene. Hit-testing maps a ray's UV on the plane back to canvas
// coordinates so the same layout drives both rendering and interaction.

export const VR_PANEL_W = 1024;
export const VR_PANEL_H = 256;

export type VrPanelButtonId =
  | 'back'
  | 'playPause'
  | 'forward'
  | 'mute'
  | 'recenter';
export type VrPanelTarget = VrPanelButtonId | 'seek';

type Rect = { x: number; y: number; w: number; h: number };

const BTN_ORDER: VrPanelButtonId[] = [
  'back',
  'playPause',
  'forward',
  'mute',
  'recenter',
];
const BTN_W = 150;
const BTN_H = 120;
const BTN_Y = 28;
const BTN_GAP = 24;
const BTN_TOTAL = BTN_W * BTN_ORDER.length + BTN_GAP * (BTN_ORDER.length - 1);
const BTN_START_X = (VR_PANEL_W - BTN_TOTAL) / 2;

export const VR_BUTTONS: { id: VrPanelButtonId; rect: Rect }[] = BTN_ORDER.map(
  (id, index) => ({
    id,
    rect: {
      x: BTN_START_X + index * (BTN_W + BTN_GAP),
      y: BTN_Y,
      w: BTN_W,
      h: BTN_H,
    },
  }),
);

const VR_BAR: Rect = { x: 70, y: 184, w: VR_PANEL_W - 140, h: 28 };

export type VrPanelState = {
  isPaused: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  hover: VrPanelTarget | null;
  dwell: number; // 0..1 fill for gaze dwell on the hovered target
};

const inRect = (x: number, y: number, r: Rect): boolean =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// uv has its origin at the bottom-left (three.js); the canvas is top-down.
export const hitTestVrPanel = (
  u: number,
  v: number,
): { target: VrPanelTarget; ratio: number } | null => {
  const x = u * VR_PANEL_W;
  const y = (1 - v) * VR_PANEL_H;

  for (const button of VR_BUTTONS) {
    if (inRect(x, y, button.rect)) {
      return { target: button.id, ratio: 0 };
    }
  }

  if (
    x >= VR_BAR.x &&
    x <= VR_BAR.x + VR_BAR.w &&
    y >= VR_BAR.y - 24 &&
    y <= VR_BAR.y + VR_BAR.h + 24
  ) {
    const ratio = (x - VR_BAR.x) / VR_BAR.w;
    return { target: 'seek', ratio: Math.min(1, Math.max(0, ratio)) };
  }

  return null;
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const drawIcon = (
  ctx: CanvasRenderingContext2D,
  id: VrPanelButtonId,
  rect: Rect,
  isPaused: boolean,
  isMuted: boolean,
  color: string,
): void => {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';

  if (id === 'mute') {
    // Speaker body.
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 12);
    ctx.lineTo(cx - 14, cy - 12);
    ctx.lineTo(cx + 2, cy - 26);
    ctx.lineTo(cx + 2, cy + 26);
    ctx.lineTo(cx - 14, cy + 12);
    ctx.lineTo(cx - 30, cy + 12);
    ctx.closePath();
    ctx.fill();

    if (isMuted) {
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy - 16);
      ctx.lineTo(cx + 38, cy + 16);
      ctx.moveTo(cx + 38, cy - 16);
      ctx.lineTo(cx + 14, cy + 16);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx + 14, cy, 14, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 14, cy, 26, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }
    return;
  }

  if (id === 'playPause') {
    if (isPaused) {
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 26);
      ctx.lineTo(cx - 18, cy + 26);
      ctx.lineTo(cx + 28, cy);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(cx - 22, cy - 26, 16, 52);
      ctx.fillRect(cx + 6, cy - 26, 16, 52);
    }
    return;
  }

  if (id === 'back' || id === 'forward') {
    const dir = id === 'back' ? -1 : 1;
    const tri = (offset: number): void => {
      ctx.beginPath();
      ctx.moveTo(cx + dir * (offset + 26), cy - 24);
      ctx.lineTo(cx + dir * (offset + 26), cy + 24);
      ctx.lineTo(cx + dir * (offset - 12), cy);
      ctx.closePath();
      ctx.fill();
    };
    tri(0);
    tri(28);
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', cx, cy + 42);
    return;
  }

  // recenter: a target reticle
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
};

export const drawVrPanel = (
  ctx: CanvasRenderingContext2D,
  state: VrPanelState,
): void => {
  ctx.clearRect(0, 0, VR_PANEL_W, VR_PANEL_H);

  ctx.fillStyle = 'rgba(18, 20, 24, 0.92)';
  roundRect(ctx, 0, 0, VR_PANEL_W, VR_PANEL_H, 26);
  ctx.fill();

  for (const button of VR_BUTTONS) {
    const isHover = state.hover === button.id;
    ctx.fillStyle = isHover
      ? 'rgba(255, 143, 0, 0.92)'
      : 'rgba(40, 44, 50, 0.95)';
    roundRect(ctx, button.rect.x, button.rect.y, button.rect.w, button.rect.h, 18);
    ctx.fill();

    drawIcon(
      ctx,
      button.id,
      button.rect,
      state.isPaused,
      state.isMuted,
      isHover ? '#18130b' : '#ffd7a3',
    );

    if (isHover && state.dwell > 0) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(
        button.rect.x + button.rect.w - 16,
        button.rect.y + 16,
        10,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, state.dwell),
      );
      ctx.stroke();
    }
  }

  // Progress bar.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  roundRect(ctx, VR_BAR.x, VR_BAR.y, VR_BAR.w, VR_BAR.h, VR_BAR.h / 2);
  ctx.fill();

  const ratio =
    state.duration > 0 ? Math.min(1, state.currentTime / state.duration) : 0;
  if (ratio > 0) {
    ctx.fillStyle = state.hover === 'seek' ? '#ffb24d' : '#ff8f00';
    roundRect(ctx, VR_BAR.x, VR_BAR.y, VR_BAR.w * ratio, VR_BAR.h, VR_BAR.h / 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.font = '26px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(formatTime(state.currentTime), VR_BAR.x, VR_BAR.y + VR_BAR.h + 26);
  ctx.textAlign = 'right';
  ctx.fillText(
    formatTime(state.duration),
    VR_BAR.x + VR_BAR.w,
    VR_BAR.y + VR_BAR.h + 26,
  );
  ctx.textAlign = 'left';
};
