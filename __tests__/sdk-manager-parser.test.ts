import * as fs from "fs";
import { getNewState, parseSDKManagerOutput, AndroidPackageInfo } from "../src/sdk-manager-parser";
//const fullLog = require("fixture/real-output.txt");

describe("getNewState", () => {
    it.each([
        ["Installed packages:", "InstalledPackages"],
        ["Available Packages:", "AvailablePackages"],
        ["Available Updates:", "AvailableUpdates"],
        ["Obsoleted packages:", "None"],
        ["Loading local repository...", null],
        ["[=========  ] 25% Loading local repository..", null],
        ["Path   | Version      | Description", null],
        ["build-tools;22.0.1  | 22.0.1   | Android SDK Build-Tools 22.0.1   | build-tools\\22.0.1", null]
    ] as [string, string | null][])("'%s' -> '%s'", (input: string, expected: string | null) => {
        const actual = getNewState(input);
        expect(actual).toBe(expected);
    });
});

describe("parseSDKManagerOutput", () => {
    it("simple case", () => {
        const input = `
            Loading package information...
            [=========     ] 25% Loading local repository...
            [==============] 100% Computing updates...
            Installed packages:
            Path   | Version   | Description   | Location  
            -------   | -------   | -------   | -------
            add-ons;addon-google_apis-google-21   | 1  | Google APIs   | add-ons\\addon-google_apis-google-21\\
            platforms;android-29 | 4 |  Android Platform Tools 29 | platforms\\android-29\\
            build-tools;28.0.2   | 28.0.2   | Android SDK Build-Tools 28.0.2   | build-tools\\28.0.2\\
            Available Packages:
            Path  | Version   | Description   
            -------   | -------   | -------  
            ndk-bundle   | 21.3.6528147 | NDK
            
            Available Updates:
            ID                   | Installed | Available
            -------              | -------   | -------  
            platforms;android-29 | 4         | 5        
        `;
        const expected: AndroidPackageInfo[] = [
            { name: "add-ons;addon-google_apis-google-21", version: "1", description: "Google APIs", installed: true, update: null },
            { name: "build-tools;28.0.2", version: "28.0.2", description: "Android SDK Build-Tools 28.0.2", installed: true, update: null },
            { name: "ndk-bundle", version: "21.3.6528147", description: "NDK", installed: false, update: null },
            { name: "platforms;android-29", version: "4", description: "Android Platform Tools 29", installed: true, update: "5" },
        ];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });

    it("duplicate package in available and installed", () => {
        const input = `
            Loading package information...

            Installed packages:
              Path   | Version   | Description   | Location  
              -------   | -------   | -------   | -------
              platforms;android-29 | 4 |  Android Platform Tools 29 | platforms\\android-29\\
              build-tools;28.0.2   | 28.0.2   | Android SDK Build-Tools 28.0.2   | build-tools\\28.0.2\\
            Available Packages:
              Path  | Version   | Description   
              -------   | -------   | -------  
              ndk-bundle   | 21.3.6528147 | NDK
              platforms;android-29 | 5 |  Android Platform Tools 29 
            
            Available Updates:
              ID                   | Installed | Available
              -------              | -------   | -------  
              platforms;android-29 | 4         | 5        
        `;
        const expected: AndroidPackageInfo[] = [
            { name: "build-tools;28.0.2", version: "28.0.2", description: "Android SDK Build-Tools 28.0.2", installed: true, update: null },
            { name: "ndk-bundle", version: "21.3.6528147", description: "NDK", installed: false, update: null },
            { name: "platforms;android-29", version: "4", description: "Android Platform Tools 29", installed: true, update: "5" },
        ];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });

    it("unknown section", () => {
        const input = `
        Loading package information...
        [=========     ] 25% Loading local repository...
        [==============] 100% Computing updates...
        Installed packages:
          Path   | Version   | Description   | Location  
          -------   | -------   | -------   | -------
          build-tools;28.0.2   | 28.0.2   | Android SDK Build-Tools 28.0.2   | build-tools\\28.0.2\\
        Available Packages:
          Path  | Version   | Description   
          -------   | -------   | -------  
          ndk-bundle   | 21.3.6528147 | NDK

        Secret unknown section:
          Path  | Version   | Description   
          -------   | -------   | -------  
          ndk-preview   | 21.3.6528147 | NDK

        Available Updates:
          ID                   | Installed | Available
          -------              | -------   | -------  
          ndk-bundle   | 21.3.6528147 | 21.4.6528147
        `;
        const expected: AndroidPackageInfo[] = [
            { name: "build-tools;28.0.2", version: "28.0.2", description: "Android SDK Build-Tools 28.0.2", installed: true, update: null },
            { name: "ndk-bundle", version: "21.3.6528147", description: "NDK", installed: false, update: "21.4.6528147" },
        ];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });

    it("real windows case", () => {
        const input = fs.readFileSync(`${__dirname}/fixture/complex-output.txt`).toString();
        const expected = [
            { name: "add-ons;addon-google_apis-google-22", version: "1", description: "Google APIs", installed: false, update: null },
            { name: "add-ons;addon-google_apis-google-23", version: "1", description: "Google APIs", installed: true, update: null },
            { name: "add-ons;addon-google_apis-google-24", version: "1", description: "Google APIs", installed: true, update: null },
            { name: "build-tools;19.1.0", version: "19.1.0", description: "Android SDK Build-Tools 19.1", installed: false, update: null },
            { name: "build-tools;29.0.2", version: "29.0.2", description: "Android SDK Build-Tools 29.0.2", installed: false, update: null },
            { name: "build-tools;29.0.3", version: "29.0.3", description: "Android SDK Build-Tools 29.0.3", installed: true, update: null },
            { name: "build-tools;30.0.0", version: "30.0.0", description: "Android SDK Build-Tools 30", installed: true, update: null },
            { name: "build-tools;30.0.1", version: "30.0.1", description: "Android SDK Build-Tools 30.0.1", installed: false, update: null },
            { name: "cmake;3.10.2.4988404", version: "3.10.2", description: "CMake 3.10.2.4988404", installed: true, update: null },
            { name: "cmake;3.6.4111459", version: "3.6.4111459", description: "CMake 3.6.4111459", installed: true, update: null },
            { name: "cmdline-tools;latest", version: "2.1", description: "Android SDK Command-line Tools (latest)", installed: false, update: null },
            { name: "emulator", version: "30.0.12", description: "Android Emulator", installed: false, update: null },
            { name: "extras;google;m2repository", version: "58", description: "Google Repository", installed: true, update: null },
            { name: "extras;intel;Hardware_Accelerated_Execution_Manager", version: "7.5.6", description: "Intel x86 Emulator Accelerator (HAXM installer)", installed: false, update: null },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout-solver;1.0.1", version: "1", description: "Solver for ConstraintLayout 1.0.1", installed: false, update: null },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout-solver;1.0.2", version: "1", description: "Solver for ConstraintLayout 1.0.2", installed: true, update: null },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout;1.0.1", version: "1", description: "ConstraintLayout for Android 1.0.1", installed: false, update: null },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout;1.0.2", version: "1", description: "ConstraintLayout for Android 1.0.2", installed: true, update: null },
            { name: "ndk-bundle", version: "21.3.6528147", description: "NDK", installed: true, update: "21.4.6528148" },
            { name: "ndk;19.2.5345600", version: "19.2.5345600", description: "NDK (Side by side) 19.2.5345600", installed: false, update: null },
            { name: "ndk;21.2.6472646", version: "21.2.6472646", description: "NDK (Side by side) 21.2.6472646", installed: false, update: null },
            { name: "ndk;21.3.6528147", version: "21.3.6528147", description: "NDK (Side by side) 21.3.6528147", installed: false, update: null },
            { name: "patcher;v4", version: "1", description: "SDK Patch Applier v4", installed: true, update: null },
            { name: "platform-tools", version: "30.0.4", description: "Android SDK Platform-Tools", installed: true, update: null },
            { name: "platforms;android-28", version: "6", description: "Android SDK Platform 28", installed: false, update: null },
            { name: "platforms;android-29", version: "4", description: "Android SDK Platform 29", installed: true, update: "5" },
            { name: "platforms;android-30", version: "2", description: "Android SDK Platform 30", installed: true, update: null },
            { name: "system-images;android-30;google_apis;x86", version: "7", description: "Google APIs Intel x86 Atom System Image", installed: false, update: null },
            { name: "system-images;android-30;google_apis;x86_64", version: "7", description: "Google APIs Intel x86 Atom_64 System Image", installed: false, update: null },
            { name: "tools", version: "26.1.1", description: "Android SDK Tools 26.1.1", installed: true, update: null},
        ];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });
});