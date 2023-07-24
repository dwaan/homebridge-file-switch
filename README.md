# Homebridge File Switch

Observer and write a (text) file and display it as switch accessory in Home app. Each time the file changes it will automagicaly update the accesory status.

## Requirements

- [Homebridge](https://github.com/nfarina/homebridge) HomeKit support for the impatient
- A text file that can be read and modify by this plugin

## Example config

Use Homebridge config UI X, or manually edit your config.json and add this configuration:

```json
    {
        "accessories": [
            {
                "name": "The name",
                "file": "/path/to/your/file.txt",
                "onValue": "true",
                "offValue": "false"
            }
        ],
        "debug": false,
        "platform": "fileSwitchPlatform"
    }
```
