## Creating instance of running react application using webpack

### You can use npm or yarn to install the package and run the instance

- For NPM
  - npm install
  - npm run serve

### Run as desktop app with Electron

- Development (file-based, no dev server):
  - npm run electron:dev
- Optional development mode with webpack dev server:
  - npm run electron:dev:server
- Production build + Electron:
  - npm run build
  - npm run electron

### Package desktop app (Windows)

- Create unpacked app directory in release/:
  - npm run package:dir
- Create NSIS installer in release/:
  - npm run package:win

### Branding (icon + metadata)

- App metadata and installer naming are configured in package.json under the build field.
- Windows icon file is at buildResources/icon.ico.
- To regenerate the icon:
  - node scripts/generate-brand-icon.js
- To use your own brand icon, replace buildResources/icon.ico with your .ico file.

If installer build fails with a symlink permission error from electron-builder, run terminal as Administrator or enable Windows Developer Mode, then retry npm run package:win.

- For yarn
  - yarn
  - yarn serve

### Other package installed

- styled components for styling
- react-router for routing
