// import { app } from 'electron';
// import * as remote from '@electron/remote';
import * as path from 'path';
import * as fs from 'fs';

export interface StoreDefaults {
    devMode: boolean,
    muted: boolean,
    sensitive: boolean,
    voiceOver: boolean,
    startSSG: number,
    displayOff: number,
    requirePass: number,
    runOnBattery: boolean,
    id: string | undefined
}

export class Store {
    private configPath: string;
    private data: any;
    defaults: StoreDefaults = {
        devMode: false,
        muted: false,
        sensitive: false,
        voiceOver: false,
        startSSG: 5,
        displayOff: 15,
        requirePass: 0,
        runOnBattery: false,
        id: undefined
    };

    constructor(options: any) {
        // const app = options.app;
        // console.log('app', app);
        const userDataPath = options.userDataPath; // (app/*  || remote.app */).getPath('userData');
        // console.log('userDataPath', userDataPath);
        this.configPath = path.join(userDataPath, options.configName + '.json');
        console.log('configPath', this.configPath);
        this.data = this.parseDataFile(this.configPath);
    }

    // GETTERS
    get devMode(): boolean {
        return this.data.devMode ? Boolean(this.data.devMode) : this.defaults.devMode;
    }

    get id(): string {
        return this.data.id ? this.data.id : this.defaults.id;
    }

    get sensitive(): boolean {
        return this.data.sensitive ? Boolean(this.data.sensitive) : this.defaults.sensitive;
    }

    get muted(): boolean {
        return this.data.muted ? Boolean(this.data.muted) : this.defaults.muted;
    }

    get voiceOver(): boolean {
        return this.data.voiceOver ? Boolean(this.data.voiceOver) : this.defaults.voiceOver;
    }

    get startSSG(): number {
        return this.data.startSSG ? Number(this.data.startSSG) : this.defaults.startSSG;
    }

    get displayOff(): number {
        return this.data.displayOff ? Number(this.data.displayOff) : this.defaults.displayOff;
    }

    get requirePass(): number {
        return this.data.requirePass ? Number(this.data.requirePass) : this.defaults.requirePass;
    }

    get runOnBattery(): boolean {
        return this.data.runOnBattery ? Boolean(this.data.runOnBattery) : this.defaults.runOnBattery;
    }

    // SETTERS
    set devMode(value: boolean) {
        // console.log('setDevMode', value);
        this.data.devMode = value;
        this.writeData();
        // fs.writeFileSync(this.path, JSON.stringify(this.data));
    }

    set id(value: string) {
        this.data.id = value;
        this.writeData();
        // fs.writeFileSync(this.path, JSON.stringify(this.data));
    }

    set sensitive(value: boolean) {
        this.data.sensitive = value;
        this.writeData();
        // fs.writeFileSync(this.path, JSON.stringify(this.data));
    }

    set muted(value: boolean) {
        this.data.muted = value;
        this.writeData();
    }

    set voiceOver(value: boolean) {
        this.data.voiceOver = value;
        this.writeData();
    }

    set startSSG(value: number) {
        this.data.startSSG = value;
        this.writeData();
    }

    set displayOff(value: number) {
        this.data.displayOff = value;
        this.writeData();
    }

    set requirePass(value: number) {
        this.data.requirePass = value;
        this.writeData();
    }

    set runOnBattery(value: boolean) {
        this.data.runOnBattery = value;
        this.writeData();
    }
    // METHODS

    private writeData() {
        fs.writeFileSync(this.configPath, JSON.stringify(this.data));
    }

    private parseDataFile(filePath: string) {
        try {
            const file = fs.readFileSync(filePath);
            return JSON.parse(file.toString());
        } catch (error) {
            console.error('Cannot read config file :/');
            return this.defaults;
        }
    }

}