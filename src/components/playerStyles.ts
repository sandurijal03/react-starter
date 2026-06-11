import styled, { createGlobalStyle, css } from 'styled-components';

const MOBILE_BREAKPOINT = '720px';

const panelSurface = css`
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--divider);
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
`;

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap');

  :root {
    --bg-1: #121316;
    --bg-2: #0c0d10;
    --panel: #26292d;
    --panel-2: #1d1f23;
    --ink: #f2f3f5;
    --ink-soft: #b5bac2;
    --accent: #ff8f00;
    --accent-strong: #ff6f00;
    --ring: rgba(255, 143, 0, 0.34);
    --divider: rgba(255, 255, 255, 0.1);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Ubuntu', sans-serif;
    color: var(--ink);
    min-height: 100vh;
    background:
      radial-gradient(circle at 10% 15%, rgba(255, 143, 0, 0.18), transparent 35%),
      radial-gradient(circle at 90% 80%, rgba(255, 111, 0, 0.18), transparent 40%),
      linear-gradient(160deg, var(--bg-1), var(--bg-2));
  }
`;

export const PlayerRoot = styled.main`
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 0.65rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0.35rem;
  }
`;

export const HeroPanel = styled.section`
  ${panelSurface}
  padding: 0.72rem 0.95rem;

  h1 {
    margin: 0;
    font-size: clamp(0.95rem, 3vw, 1.1rem);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 700;
  }

  p {
    margin: 0.35rem 0 0;
    color: var(--ink-soft);
    font-size: 0.82rem;
    letter-spacing: 0.01em;
  }
`;

export const ControlsPanel = styled.section<{ $insidePlayer?: boolean }>`
  ${panelSurface}
  padding: 0.62rem;

  ${({ $insidePlayer }) =>
    $insidePlayer
      ? `
    border-radius: 6px;
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: none;
    background: linear-gradient(180deg, rgba(35, 38, 43, 0.94), rgba(27, 29, 33, 0.96));
  `
      : ''}

  label {
    display: block;
    font-size: 0.72rem;
    color: var(--ink-soft);
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

export const CompactToolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.42rem;
  margin-bottom: 0.52rem;
`;

export const ToolbarGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 34px;
`;

export const CompactSelect = styled.select`
  border-radius: 6px;
  border: 1px solid var(--divider);
  background: #17191d;
  color: var(--ink);
  min-width: 124px;
  padding: 0.38rem 0.55rem;
  font-size: 0.82rem;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px var(--ring);
    border-color: var(--accent);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 100px;
  }
`;

export const IconButton = styled.button<{ $active?: boolean }>`
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(255, 143, 0, 0.75)' : 'rgba(255, 255, 255, 0.18)'};
  background: ${({ $active }) =>
    $active ? 'rgba(255, 143, 0, 0.16)' : 'rgba(20, 23, 28, 0.9)'};
  color: ${({ $active }) => ($active ? '#ffd7a3' : '#e7eaf0')};
  cursor: pointer;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;

  svg {
    width: 17px;
    height: 17px;
    fill: currentColor;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(255, 143, 0, 0.75);
    box-shadow: 0 0 0 2px rgba(255, 143, 0, 0.18);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.58;
    transform: none;
  }
`;

export const IconFileLabel = styled.label`
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(20, 23, 28, 0.9);
  color: #e7eaf0;
  cursor: pointer;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;

  svg {
    width: 17px;
    height: 17px;
    fill: currentColor;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 143, 0, 0.75);
    box-shadow: 0 0 0 2px rgba(255, 143, 0, 0.18);
  }
`;

export const CompactVolumeSlider = styled.input`
  accent-color: var(--accent);
  width: 96px;
`;

export const MenuPopover = styled.details`
  position: relative;
`;

export const MenuPopoverButton = styled.summary<{ $active?: boolean }>`
  list-style: none;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(255, 143, 0, 0.75)' : 'rgba(255, 255, 255, 0.18)'};
  background: ${({ $active }) =>
    $active ? 'rgba(255, 143, 0, 0.16)' : 'rgba(20, 23, 28, 0.9)'};
  color: ${({ $active }) => ($active ? '#ffd7a3' : '#e7eaf0')};
  cursor: pointer;

  svg {
    width: 17px;
    height: 17px;
    fill: currentColor;
  }

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    border-color: rgba(255, 143, 0, 0.75);
  }
`;

export const MenuPopoverPanel = styled.div`
  display: none;
  position: absolute;
  top: calc(100% + 7px);
  right: 0;
  min-width: min(290px, 80vw);
  padding: 0.56rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(
    180deg,
    rgba(21, 23, 27, 0.98),
    rgba(16, 18, 22, 0.98)
  );
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.42);
  z-index: 20;

  ${MenuPopover}[open] & {
    display: block;
  }
`;

export const PopoverTitle = styled.p`
  margin: 0 0 0.44rem;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
`;

export const PopoverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.42rem;
  margin-bottom: 0.45rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const PopoverText = styled.span`
  font-size: 0.8rem;
  color: var(--ink-soft);
`;

export const MiniButton = styled.button`
  border: 1px solid rgba(255, 143, 0, 0.65);
  border-radius: 6px;
  padding: 0.4rem 0.55rem;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  color: #18130b;
  background: linear-gradient(180deg, #ff9f1a, #ff7f00);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--accent-strong);
  }

  &:disabled {
    opacity: 0.62;
    cursor: not-allowed;
  }
`;

export const PlayerMenuBar = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
  margin-bottom: 0.7rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
  }
`;

export const MenuSection = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(9, 10, 14, 0.28);
  border-radius: 6px;
  padding: 0.45rem;
`;

export const MenuSectionTitle = styled.p`
  margin: 0 0 0.4rem;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
`;

export const MenuInlineRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

export const MenuToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  margin: 0;
  font-size: 0.78rem;
  color: var(--ink-soft);
  text-transform: none;
  letter-spacing: 0;
`;

export const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-wrap: wrap;
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-wrap: wrap;
  }
`;

export const SelectControl = styled.label`
  display: inline-flex !important;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
  }
`;

export const CheckboxLabel = styled.label`
  display: inline-flex !important;
  align-items: center;
  gap: 0.45rem;
  margin: 0 !important;
  cursor: pointer;
  color: var(--ink-soft);
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  text-transform: none !important;
`;

export const CheckboxInput = styled.input`
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
`;

export const StyledSelect = styled.select`
  border-radius: 6px;
  border: 1px solid var(--divider);
  background: #17191d;
  color: var(--ink);
  padding: 0.5rem 0.6rem;
  font: inherit;
  min-width: 150px;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px var(--ring);
    border-color: var(--accent);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
  }
`;

export const UrlInput = styled.input`
  flex: 1;
  border-radius: 6px;
  border: 1px solid var(--divider);
  background: #17191d;
  color: var(--ink);
  padding: 0.65rem 0.7rem;
  font: inherit;

  &::placeholder {
    color: #7f8793;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px var(--ring);
    border-color: var(--accent);
  }
`;

export const ControlButton = styled.button`
  border: 1px solid rgba(255, 143, 0, 0.68);
  border-radius: 6px;
  padding: 0.62rem 0.9rem;
  font: inherit;
  font-weight: 700;
  color: #18130b;
  background: linear-gradient(180deg, #ff9f1a, #ff7f00);
  cursor: pointer;
  transition:
    transform 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: var(--accent-strong);
    box-shadow: 0 0 0 2px rgba(255, 143, 0, 0.22);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
    border-color: rgba(255, 255, 255, 0.2);
    background: #5b616c;
    color: #d9dde4;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 120px;
    flex: 1;
  }
`;

export const FileButton = styled.label`
  border: 1px solid rgba(255, 143, 0, 0.68);
  border-radius: 6px;
  padding: 0.62rem 0.9rem;
  font: inherit;
  font-weight: 700;
  color: #18130b;
  background: linear-gradient(180deg, #ff9f1a, #ff7f00);
  cursor: pointer;
  transition:
    transform 120ms ease,
    background-color 120ms ease;

  &:hover {
    transform: translateY(-1px);
    background: var(--accent-strong);
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const VolumeControl = styled.label`
  display: inline-flex !important;
  align-items: center;
  gap: 0.5rem;
  margin: 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: 100%;
    justify-content: space-between;
  }
`;

export const VolumeSlider = styled.input`
  accent-color: var(--accent);

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: min(180px, 60vw);
  }
`;

export const TimelineRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.45rem;

  label {
    margin: 0;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
`;

export const TimelineSlider = styled.input`
  width: 100%;
  accent-color: var(--accent);
`;

export const TimelineText = styled.span`
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
  font-size: 0.82rem;
`;

export const StatusText = styled.p`
  margin: 0.38rem 0 0;
  font-size: 0.8rem;
  color: #dde1e7;
`;

export const StatusSubtle = styled.p`
  margin: 0.17rem 0 0;
  font-size: 0.72rem;
  color: var(--ink-soft);
`;

export const ViewerPanel = styled.section<{ $isFullscreen?: boolean }>`
  ${panelSurface}
  position: relative;
  padding: ${({ $isFullscreen }) => ($isFullscreen ? '0' : '0.38rem')};
  overflow: hidden;

  ${({ $isFullscreen }) =>
    $isFullscreen
      ? `
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: #000;
  `
      : ''}
`;

export const ViewerControlsWrap = styled.div<{
  $floating?: boolean;
  $visible?: boolean;
}>`
  margin-top: ${({ $floating }) => ($floating ? '0' : '0.38rem')};

  ${({ $floating, $visible }) =>
    $floating
      ? `
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    z-index: 30;
    opacity: ${$visible ? '1' : '0'};
    transform: translateY(${$visible ? '0' : '12px'});
    pointer-events: ${$visible ? 'auto' : 'none'};
    transition: opacity 160ms ease, transform 160ms ease;
  `
      : ''}
`;

export const ViewerCanvas = styled.div<{ $isFullscreen?: boolean }>`
  width: 100%;
  height: ${({ $isFullscreen }) =>
    $isFullscreen ? '100vh' : 'clamp(400px, calc(100vh - 220px), 980px)'};
  border-radius: ${({ $isFullscreen }) => ($isFullscreen ? '0' : '6px')};
  overflow: hidden;
  background: #000;
  border: ${({ $isFullscreen }) =>
    $isFullscreen ? '0' : '1px solid rgba(255, 255, 255, 0.12)'};
  position: relative;

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .vr-enter-button {
    position: absolute !important;
    left: 12px !important;
    bottom: 12px !important;
    border: 0 !important;
    border-radius: 6px !important;
    background: rgba(22, 24, 28, 0.94) !important;
    border: 1px solid rgba(255, 143, 0, 0.7) !important;
    color: #ffc57d !important;
    font-family: 'Ubuntu', sans-serif !important;
    font-size: 12px !important;
    letter-spacing: 0.03em;
  }
`;
