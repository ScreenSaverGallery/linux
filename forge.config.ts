import type { ForgeConfig } from '@electron-forge/shared-types';
// import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';


const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: "ScreenSaverGallery",
    executableName: "screensavergallery",
    icon: `${__dirname}/src/assets/iconset/ssg-icon-512`,
    appBundleId: "org.metazoa.screensavergallery",
    appCopyright: "Copyright © 2012 metazoa.org"
  },
  rebuildConfig: {},
  makers: [
    // new MakerZIP({}, /* ['linux'] */),
    new MakerRpm({
      options: {
        homepage: 'https://screensaver.gallery',
        icon: `${__dirname}/src/assets/iconset/ssg-icon-512.png`
      }
    }),
    new MakerDeb({
      options: {
        homepage: 'https://screensaver.gallery',
        icon: `${__dirname}/src/assets/iconset/ssg-icon-512.png`
      }
    })
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        nodeIntegration: true,
        entryPoints: [
          {
            html: './src/app/modal/modal.html',
            js: './src/app/modal/renderer.ts',
            name: 'config_window',
            nodeIntegration: true,
            preload: {
              js: './src/app/modal/preload.ts'
            }
          }
        ]
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'ScreenSaverGallery',
        name: 'linux'
      },
      draft: true
    })
  ]
};

export default config;
