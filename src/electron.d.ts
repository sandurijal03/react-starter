export {};

declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean;
      requestMediaUrl: (initialUrl: string) => Promise<string | null>;
      onMenuOpenFile: (callback: (fileUrl: string) => void) => () => void;
      onMenuOpenUrl: (callback: () => void) => () => void;
    };
  }
}
