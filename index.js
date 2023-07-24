var Service, Characteristic;

const fs = require('fs');

const PLUGIN_NAME = 'homebridge-file-swwitch';
const PLATFORM_NAME = 'fileSwitchPlatform';

class fileSwitchPlatform {
    constructor(log, config) {
        this.log = log;
        this.switches = config.accessories || [];
        this.debug = config.debug || true;
    }

    accessories(callback) {
        const accessories = [];

        this.switches.forEach((switchConfig, index) => {
            const name = switchConfig.name || `File Switch ${index + 1}`;
            const file = switchConfig.file;
            const onValue = switchConfig.onValue || 'true';
            const offValue = switchConfig.offValue || 'false';

            accessories.push(new fileSwitchAccessory(this.log, name, file, onValue, offValue, this.debug));
        });

        callback(accessories);
    }
}

class fileSwitchAccessory {
    constructor(log, name, file, onValue, offValue, debug) {
        // Configuration
        this.log = log;
        this.name = name;
        this.file = file;
        this.onValue = onValue;
        this.offValue = offValue;
        this.debug = debug;

        // Main variable
        this.switchState = false;

        this.initFileWatch = () => {
            // Read the initial state from the file
            this.readFile();

            // Watch the file for changes
            fs.watch(this.file, (eventType) => {
                this.extraLog("File change");

                if (eventType === 'change') {
                    this.readFile();
                }
            });
        }

        fs.access(this.file, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // File doesn't exist, create it with default content
                    fs.writeFile(this.file, this.offValue, (writeErr) => {
                        if (writeErr) {
                            this.log(`Error creating the file: ${writeErr.message}`);
                        } else {
                            this.log(`File created successfully.`);
                            this.initFileWatch();
                        }
                    });
                } else {
                    this.log(`Error accessing the file: ${err.message}`);
                }
            } else {
                // File exists and is accessible, start watching
                this.initFileWatch();
            }
        });

        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Dwan');
        this.informationService
            .setCharacteristic(Characteristic.Model, "switch")
            .setCharacteristic(Characteristic.SerialNumber, '1.0.0');

        this.switchService = new Service.Switch(this.name);
        this.switchService
            .getCharacteristic(Characteristic.On)
            .onGet(this.getSwitchState.bind(this))
            .onSet(this.setSwitchState.bind(this));
    }

    readFile() {
        this.extraLog("Reading file");

        try {
            const data = fs.readFileSync(this.file, 'utf8');
            this.switchState = data.trim() === this.onValue;

            this.extraLog("Updating switch state");
            this.switchService.updateCharacteristic(Characteristic.On, this.switchState);
        } catch (error) {
            this.log(`Error reading file: ${error.message}`);
        }
    }

    writeFile() {
        const data = this.switchState ? this.onValue : this.offValue;

        this.extraLog("Writing to file");

        fs.writeFile(this.file, data, (err) => {
            if (err) {
                this.log(`Error writing to file: ${err.message}`);
            } else {
                this.log(`File updated successfully.`);
            }
        });
    }

    getSwitchState() {
        this.extraLog(`Switch state is ${this.switchState ? '🟢 ON' : '⚪️ OFF'}`);
        return this.switchState;
    }

    setSwitchState(value) {
        this.switchState = value;
        this.log(`Setting switch state to ${this.switchState ? '🟢 ON' : '⚪️ OFF'}`);
        this.writeFile();
    }

    getServices() {
        this.extraLog("Get service");

        return [this.switchService, this.informationService];
    }

    extraLog(message) {
        if (this.debug) this.log(message);
    }
}

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, fileSwitchPlatform, true);
};
