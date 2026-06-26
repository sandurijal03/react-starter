export {};

declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean;
      requestMediaUrl: (initialUrl: string) => Promise<string | null>;
      getWindowFullscreen: () => Promise<boolean>;
      getWindowMaximized: () => Promise<boolean>;
      onMenuOpenFile: (callback: (fileUrl: string) => void) => () => void;
      onMenuOpenUrl: (callback: () => void) => () => void;
      onWindowFullscreenChange: (
        callback: (isFullscreen: boolean) => void,
      ) => () => void;
      onWindowMaximizeChange: (
        callback: (isMaximized: boolean) => void,
      ) => () => void;
    };
  }
}
