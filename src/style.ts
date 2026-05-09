import styled, { createGlobalStyle, css } from "styled-components";

const MOBILE_BREAKPOINT = "720px";

const panelSurface = css`
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(16, 24, 40, 0.12);
`;

export const GlobalStyle = createGlobalStyle`
  @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap");

  :root {
    --bg-1: #f2efe8;
    --bg-2: #d9e6ff;
    --ink: #101828;
    --ink-soft: #475467;
    --accent: #0f766e;
    --accent-strong: #0a5d57;
    --ring: rgba(15, 118, 110, 0.28);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    color: var(--ink);
    min-height: 100vh;
    background:
      radial-gradient(circle at 10% 15%, rgba(255, 203, 112, 0.42), transparent 38%),
      radial-gradient(circle at 90% 80%, rgba(120, 191, 255, 0.5), transparent 40%),
      linear-gradient(160deg, var(--bg-1), var(--bg-2));
  }
`;

export const PlayerRoot = styled.main`
  width: min(1160px, calc(100vw - 2rem));
  margin: 1rem auto 2rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
`;

export const HeroPanel = styled.section`
  ${panelSurface}
  padding: 1rem 1.1rem;

  h1 {
    margin: 0;
    font-size: clamp(1.3rem, 4.5vw, 2rem);
    letter-spacing: -0.03em;
  }

  p {
    margin: 0.45rem 0 0;
    color: var(--ink-soft);
  }
`;

export const ControlsPanel = styled.section`
  ${panelSurface}
  padding: 1rem 1.1rem;

  label {
    display: block;
    font-size: 0.84rem;
    color: var(--ink-soft);
    margin-bottom: 0.35rem;
  }
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

export const StyledSelect = styled.select`
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.16);
  background: white;
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
  border-radius: 12px;
  border: 1px solid rgba(16, 24, 40, 0.16);
  padding: 0.65rem 0.7rem;
  font: inherit;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px var(--ring);
    border-color: var(--accent);
  }
`;

export const ControlButton = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 0.62rem 0.9rem;
  font: inherit;
  font-weight: 600;
  color: white;
  background: var(--accent);
  cursor: pointer;
  transition:
    transform 120ms ease,
    background-color 120ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: var(--accent-strong);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
    background: #9aa4b2;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    min-width: 120px;
    flex: 1;
  }
`;

export const FileButton = styled.label`
  border: 0;
  border-radius: 12px;
  padding: 0.62rem 0.9rem;
  font: inherit;
  font-weight: 600;
  color: white;
  background: var(--accent);
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
  margin-top: 0.6rem;

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
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
`;

export const StatusSubtle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--ink-soft);
`;

export const ViewerPanel = styled.section`
  ${panelSurface}
  padding: 0.55rem;
  overflow: hidden;
`;

export const ViewerCanvas = styled.div`
  width: 100%;
  height: clamp(300px, 62vh, 760px);
  border-radius: 14px;
  overflow: hidden;
  background: #111;
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
    border-radius: 12px !important;
    background: rgba(16, 24, 40, 0.88) !important;
    font-family: "Space Grotesk", sans-serif !important;
    font-size: 12px !important;
    letter-spacing: 0.03em;
  }
`;
