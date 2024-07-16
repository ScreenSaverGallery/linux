import { app, BrowserWindow, Tray, Menu } from 'electron';
import * as remote from '@electron/remote/main';
import { ipcMain } from 'electron';
import { Store } from './app/store';
import { ScreenSaverGallery } from './app/screen-saver-gallery';
import { Updater } from './app/updater';
import { v4 as uuidv4 } from 'uuid'; // module not found error
import * as path from 'path';
import * as ChildProcess from 'child_process';

// 🐶 TODO: TIMING, POWER, UPDATER

declare const CONFIG_WINDOW_WEBPACK_ENTRY: string;
declare const CONFIG_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	app.quit();
}
// initialize remote
remote.initialize();

// app
// CRUCIAL !! ALLOW AUTOPLAY ON MEDIA
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// updater
// const updater = new Updater();
// updater.check();

// tray
let tray!: Tray;

// app user data storage
const store: Store = new Store({
	userDataPath: app.getPath('userData'),
	configName: 'config',
});
// remote window – ssg options
const remoteWindow = ipcMain;


if (!store.id) store.id = uuidv4(); // set id for navigator if not set

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// app.quit();
});

app.on('ready', () => {
    // tray
    initTray();
    // config/remote window sent message
    remoteWindow.on('message', (event: any, data: any) => {
		console.log('data', data);
		if (data.devMode) store.devMode = data.value;
		if (data.sensitive) store.sensitive = data.value;
		if (data.muted) store.muted = data.value;
        if (data.voiceOver) store.voiceOver = data.value;
        if (data.startSSG) store.startSSG = data.value;
        if (data.displayOff) store.displayOff = data.value;
        if (data.requirePass) store.requirePass = data.value;
        if (data.runOnBattery) store.runOnBattery = data.value;
	});
});

function initTray() {
    // tray
    tray = new Tray(`${__dirname}/assets/iconset/ssg-icon-32.png`);
    const trayMenu: Menu = Menu.buildFromTemplate([
        {
            label: '🦑️ Options',
            click: () => { showConfigModal(); }
        },
        {
            label: '🐣️ Preview',
            click: () => { startScreenSaver(); }
        },
        {
            type: 'separator'
        },
        {
            role: 'quit'
        }
    ]);
    tray.setContextMenu(trayMenu);
}

function showConfigModal() {
    const modal = new BrowserWindow({
        width: store.devMode ? 1400 : 700, 
        height: 512, 
        webPreferences: {
            sandbox: false,
            nodeIntegration: true,
            preload: CONFIG_WINDOW_PRELOAD_WEBPACK_ENTRY, // `${__dirname}/assets/modal/modal.js`,
            contextIsolation: true,
            devTools: store.devMode
        },
        show: false,
        frame: true,
        roundedCorners: true
    });
    modal.setIcon(`${__dirname}/assets/iconset/ssg-icon-128.png`)
    // no window menu
    modal.setMenu(null);
    remote.enable(modal.webContents);
    // modal.loadURL(`${modalUrl}?devMode=${devMode}&muted=${muted}&sensitive=${sensitive}`);
    const qureyParams = `devMode=${store.devMode}&muted=${store.muted}&sensitive=${store.sensitive}&voiceOver=${store.voiceOver}&startSSG=${store.startSSG}&displayOff=${store.displayOff}&requirePass=${store.requirePass}&runOnBattery=${store.runOnBattery}`;
    modal.loadURL(`${CONFIG_WINDOW_WEBPACK_ENTRY}?${qureyParams}`);
    // modal.loadURL(CONFIG_WINDOW_WEBPACK_ENTRY, {});
    if (store.devMode) modal.webContents.openDevTools(); // temp

    modal.once('ready-to-show', () => {
        modal.show();
    });

    modal.on('close', () => {
        // app.quit();
    });
}

function startScreenSaver() {
	const ssg = new ScreenSaverGallery(false, store.devMode, store);
	ssg.init();
}