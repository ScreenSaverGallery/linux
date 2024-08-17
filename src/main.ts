import { app, BrowserWindow, Tray, Menu, powerSaveBlocker, powerMonitor } from 'electron';
import * as remote from '@electron/remote/main';
import { ipcMain } from 'electron';
import { Store } from './app/store';
import { ScreenSaverGallery } from './app/screen-saver-gallery';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import * as path from 'path';
import * as ChildProcess from 'child_process';
import AutoLaunch from 'auto-launch';
// rxjs
import { Subscription } from 'rxjs';

// 🐶 TODO: TIMING, POWER, UPDATER, RUN ON START (yarn add node-auto-launch) see: https://github.com/Teamwork/node-auto-launch!

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
// TODO!!!

// autostart
// app.setLoginItemSettings({
//     openAtLogin: true
// });
const launcher = new AutoLaunch({
    name: 'ScreenSaverGallery'
});

launcher.isEnabled()
.then((isEnabled: boolean) => {
    console.log('autolaunch is enabled?', isEnabled);
    if (isEnabled) return;
    launcher.enable();
})
.catch((e: any) => console.error(e));

// tray
let tray!: Tray;

// app user data storage
const store: Store = new Store({
	userDataPath: app.getPath('userData'),
	configName: 'config',
});
// remote window – ssg options
const remoteWindow = ipcMain;
// running screensaver (windows/screens)
let ssg: any;
let ssgWindows: BrowserWindow[] = [];

let IDLE_TIMER: any = null;
const IDLE_TIMER_INTERVAL: number = 1000;
let isRunning: boolean = false;
let isRunningInSeconds: number = 0;
let blockId: number | null = null;
let closeSubscribed: boolean = false;
let screenLocked: boolean = false;


if (!store.id) store.id = uuidv4(); // set id for navigator if not set

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// app.quit();
});

app.on('before-quit', () => {
    console.log('on before-quit');
    if (IDLE_TIMER) {
        clearInterval(IDLE_TIMER);
        IDLE_TIMER = null;
    }
})

app.on('ready', () => {
    // tray
    initTray();
    // init power mode
    initPowerMode();
    // config/remote window sent message
    remoteWindow.on('message', (event: any, data: any) => {
		console.log('data', data);
		if (data.devMode) store.devMode = Boolean(data.value);
		if (data.sensitive) store.sensitive = Boolean(data.value);
		if (data.muted) store.muted = Boolean(data.value);
        if (data.voiceOver) store.voiceOver = Boolean(data.value);
        if (data.startSSG) store.startSSG = Number(data.value);
        if (data.displayOff) store.displayOff = Number(data.value);
        if (data.requirePass) store.requirePass = Number(data.value);
        if (data.runOnBattery) store.runOnBattery = Boolean(data.value);
        if (data.closed) {
            // config windows was closed
            console.log('CONFIG WINDOW CLOSED');
            // reinit power mode
            initPowerMode();
        }
	});

    // remoteWindow.on('') // reinit power mode when config close
});

function initPowerMode() {
    if (IDLE_TIMER) clearInterval(IDLE_TIMER);
    IDLE_TIMER = null;
    if (blockId !== null) powerSaveBlocker.stop(blockId);
    if (canRun()) {
        console.log('screensaver can run');
        blockId = powerSaveBlocker.start('prevent-display-sleep');
        
        IDLE_TIMER = setInterval(() => {
            // console.log('...idle timer loop');
            const systemIdle: number = powerMonitor.getSystemIdleTime() / 60; // sec to min
            const lastState: string = powerMonitor.getSystemIdleState(IDLE_TIMER_INTERVAL / 1000); // check last power state (only idle is requested for start screensaver)
            // console.log('lastState', lastState);
            // console.log('devMode', store.devMode)
            // console.log('prowerBlockId', blockId);
            // console.log('store.startSSG', store.startSSG);
            // console.log('store.displayOff', store.displayOff);
            // console.log('store.requirePass', store.requirePass);
            // console.log('store.runOnBattery', store.runOnBattery);
            // console.log('systemIdle', systemIdle);
            // console.log('blank screen after', store.startSSG + store.displayOff);
            // no windows but set as running (in between of closing)
            if (!ssgWindows.length && isRunning) { // reset
                isRunning = false;
                // isRunningInSeconds = 0;
            }
            // screensaver is not running
            if (!ssgWindows.length && !isRunning) { // no screensaver running
                // check idle time, START screensaver if idle enough
                if (systemIdle >= store.startSSG && lastState === 'idle') { // only idle, not locked, unknow...
                    startScreenSaver();
                    isRunning = true;
                }            
            }

            // running and should check if turn off display
            if (ssgWindows.length && isRunning) {
                isRunningInSeconds += IDLE_TIMER_INTERVAL / 1000;
                // subscribe close to check if screen has to be screenLocked (closing after requirePass)
                if (!closeSubscribed && ssg) {
                    // not works, because systemIdle is reset to 0 when cursor moves :/
                    const closeSub: Subscription = ssg.onClose.subscribe({
                        next: () => {
                            if (store.requirePass && (isRunningInSeconds / 60) >= (store.requirePass) && !screenLocked) {
                                lockScreen();
                                // spawn('gnome-screensaver-command', ['-l']);
                            } 
                            isRunningInSeconds = 0;
                            closeSubscribed = false;
                            isRunning = false;
                            screenLocked = false;
                            closeSub.unsubscribe();
                        },
                        error: (e: any) => console.error(e)
                    });
                    closeSubscribed = true;
                }
                // system is idle without interruption, so turn display off after after ;)
                if (store.displayOff && systemIdle >= (store.startSSG + store.displayOff) && !screenLocked) { 
                    console.log('----------------- SHOULD LOCK THE SCREEN --------------');
                    // blank screen
                    // if should lock, than `gnome-screensaver-command -l` (-l, --lock)
                    if (store.requirePass) {
                        lockScreen();
                        // spawn('gnome-screensaver-command', ['-l']);
                    // if only blank without lock, than `gnome-screensaver-command -a` (-a, --activate) Turn the screensaver on (blank the screen)
                    } else {
                        blankScreen();
                        // spawn('gnome-screensaver-command', ['-a']);
                    }
                }
            }

        }, IDLE_TIMER_INTERVAL);
    }
    
}

function lockScreen(): void {
    if (ssg) ssg.destroy();
    screenLocked = true;
    // spawn('gnome-screensaver-command', ['-l']);
    // more general
    spawn('xdg-screensaver', ['lock']);
    
}

function blankScreen(): void {
    if (ssg) ssg.destroy();
    screenLocked = true;
    // spawn('gnome-screensaver-command', ['-a']);
    // more general
    spawn('xdg-screensaver', ['activate']);
    
}

function canRun(): boolean {
    if (powerMonitor.isOnBatteryPower()) {
        if (store.runOnBattery) {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}

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
    ssg = null;
	ssg = new ScreenSaverGallery(false, store.devMode, store);
	ssg.init();
    ssgWindows = ssg.windows;
}