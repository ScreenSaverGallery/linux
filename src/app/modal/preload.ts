import { shell, contextBridge, ipcRenderer } from 'electron';
// import { shell, contextBridge, ipcRenderer } from 'electron';
// 
console.log('--------- ♥️ MODAL.JS ♥️ ---------');
// 
// 
contextBridge.exposeInMainWorld('action', {
    openLink: openLink,
    close: close,
    devMode: setDevMode,
    muted: setMuted,
    sensitive: setSensitive,
    voiceOver: setVoiceOver,
    startSSG: setStartSSG,
    displayOff: setDisplayOff,
    requirePass: setRequirePass,
    runOnBattery: setRunOnBattery
});
//

function setStartSSG(value: number) {
    sendMessage({'startSSG': true, value: value});
}

function setDisplayOff(value: number) {
    sendMessage({'displayOff': true, value: value});
}

function setRequirePass(value: number) {
    sendMessage({'requirePass': true, value: value});
}

function setRunOnBattery(value: boolean) {
    sendMessage({'runOnBattery': true, value: value});
}

function setDevMode(value: boolean) {
    sendMessage({'devMode': true, value: value});
}

function setMuted(value: boolean) {
    sendMessage({'muted': true, value: value});
}

function setSensitive(value: boolean) {
    sendMessage({'sensitive': true, value: value});
}

function setVoiceOver(value: boolean) {
    sendMessage({'voiceOver': true, value: value});
}

function openLink(link: string) {
    shell.openExternal(link);
}

function sendMessage(message: any) {
    ipcRenderer.send('message', message);
}
