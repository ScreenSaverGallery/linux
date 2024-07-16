// export interface ActionWindow extends Window {
//     action: any
// }
declare global {
    interface Window {
        action: any
    }
}

export class ConfigModal {
    constructor(){}

    muteChanged(event: any) {
        const { checked } = event.target;
        // console.log('muteChanged checked?', checked);
        window.action.muted(checked);
    }

    sensitiveChanged(event: any) {
        const { checked } = event.target;
        window.action.sensitive(checked);
    }

    debugChanged(event: any) {
        const { checked } = event.target;
        window.action.devMode(checked);
    }
    
    voiceOverChanged(event: any) {
        const { checked } = event.target;
        window.action.voiceOver(checked);
    }

    startSSGChanged(event: any) {
        const { value } = event.target;
        window.action.startSSG(value);
    }

    displayOffChanged(event: any) {
        const { value } = event.target;
        window.action.displayOff(value);
    }

    requirePassChanged(event: any) {
        const { value } = event.target;
        window.action.requirePass(value);
    }

    runOnBatteryChanged(event: any) {
        const { checked } = event.target;
        window.action.runOnBattery(checked);
    }

    
    openLink(link: string) {
        window.action.openLink(link);
    }
    
    closeWindow() {
        window.close();
        return true;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const searchParams = new URLSearchParams(window.location.search);
    const config = {
        devMode: searchParams.get('devMode') === 'true',
        sensitive: searchParams.get('sensitive') === 'true',
        muted: searchParams.get('muted') === 'true',
        voiceOver: searchParams.get('voiceOver') === 'true',
        startSSG: searchParams.get('startSSG'),
        displayOff: searchParams.get('displayOff'),
        requirePass: searchParams.get('requirePass'),
        runOnBattery: searchParams.get('runOnBattery') === 'true'
    }
    const links = {
        support: 'https://screensaver.gallery/support-us?app=win',
        contact: 'https://discord.com/invite/QJtRUYptRR',
        call: 'https://screensaver.gallery/continuous-open-call?app=win'
    }
    const muteCheckboxElm: HTMLInputElement | null = document.querySelector('#mute-checkbox');
    if (muteCheckboxElm) muteCheckboxElm.checked = config.muted;
    const sensitiveCheckboxElm : HTMLInputElement | null = document.querySelector('#sensitive-checkbox');
    if (sensitiveCheckboxElm) sensitiveCheckboxElm.checked = config.sensitive;
    const debugCheckboxElm : HTMLInputElement | null = document.querySelector('#debug-checkbox');
    if (debugCheckboxElm) debugCheckboxElm.checked = config.devMode;
    const voiceOverCheckboxElm: HTMLInputElement | null = document.querySelector('#low-vision-checkbox');
    if (voiceOverCheckboxElm) voiceOverCheckboxElm.checked = config.voiceOver;
    const startSSGElm: HTMLInputElement | null = document.querySelector('#start-ssg');
    if (startSSGElm) startSSGElm.value = config.startSSG ? config.startSSG : '0';
    const displayOffElm: HTMLInputElement | null = document.querySelector('#display-off');
    if (displayOffElm) displayOffElm.value = config.displayOff ? config.displayOff : '0';
    const requirePassElm: HTMLInputElement | null = document.querySelector('#require-pass');
    if (requirePassElm) requirePassElm.value = config.requirePass ? config.requirePass : '0';
    const runOnBatteryElm: HTMLInputElement | null = document.querySelector('#run-on-battery');
    if (runOnBatteryElm) runOnBatteryElm.checked = config.runOnBattery;

    const supportLinkElm: HTMLLinkElement | null = document.querySelector('#support');
    const contactLinkElm: HTMLLinkElement | null = document.querySelector('#contact');
    const callLinkElm: HTMLLinkElement | null = document.querySelector('#call');
    const closeElm: HTMLLinkElement | null = document.querySelector('#close');

    const modal = new ConfigModal();

    supportLinkElm?.addEventListener('click', () => {
        modal.openLink(links.support);
    });
    contactLinkElm?.addEventListener('click', () => {
        modal.openLink(links.contact);
    });
    callLinkElm?.addEventListener('click', () => {
        modal.openLink(links.call);
    });
    muteCheckboxElm?.addEventListener('change', (event: any) => {
        modal.muteChanged(event);
    });
    sensitiveCheckboxElm?.addEventListener('change', (event: any) => {
        modal.sensitiveChanged(event);
    });
    voiceOverCheckboxElm?.addEventListener('change', (event: any) => {
        modal.voiceOverChanged(event);
    });
    debugCheckboxElm?.addEventListener('change', (event: any) => {
        modal.debugChanged(event);
    });
    startSSGElm?.addEventListener('change', (event: any) => {
        modal.startSSGChanged(event);
    });
    displayOffElm?.addEventListener('change', (event: any) => {
        modal.displayOffChanged(event);
    });
    requirePassElm?.addEventListener('change', (event: any) => {
        modal.requirePassChanged(event);
    });
    runOnBatteryElm?.addEventListener('change', (event: any) => {
        modal.runOnBatteryChanged(event);
    });
    closeElm?.addEventListener('click', () => {
        modal.closeWindow();
    });
});
