import * as fs from "fs";
import { getNewState, parseSDKManagerOutput, AndroidPackageInfo } from "../src/sdk-manager-parser";

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
    const getInputFromFile = (filename: string): string => {
        return fs.readFileSync(`${__dirname}/fixture/${filename}`).toString();
    };

    it("simple case", () => {
        const input = getInputFromFile("simple-output.txt");
        const expected: AndroidPackageInfo[] = [
            { name: "add-ons;addon-google_apis-google-21", localVersion: "1", remoteVersion: "1", description: "Google APIs", installed: true, update: false },
            { name: "build-tools;28.0.2", localVersion: "28.0.2", remoteVersion: "28.0.2", description: "Android SDK Build-Tools 28.0.2", installed: true, update: false },
            { name: "ndk-bundle", localVersion: "", remoteVersion: "21.3.6528147", description: "NDK", installed: false, update: false },
            { name: "platforms;android-29", localVersion: "4", remoteVersion: "4", description: "Android Platform Tools 29", installed: true, update: false },
        ];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });

    it("duplicate package in available and installed", () => {
        const input = getInputFromFile("package-update.txt");
        const expected: AndroidPackageInfo[] = [
            { name: "build-tools;28.0.2", localVersion: "28.0.2", remoteVersion: "28.0.2", description: "Android SDK Build-Tools 28.0.2", installed: true, update: false },
            { name: "ndk-bundle", localVersion: "", remoteVersion: "21.3.6528147", description: "NDK", installed: false, update: false },
            { name: "platforms;android-29", localVersion: "4", remoteVersion: "5", description: "Android Platform Tools 29", installed: true, update: true },
        ];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });

    it("unknown section", () => {
        const input = getInputFromFile("unknown-section.txt");
        const expected: AndroidPackageInfo[] = [
            { name: "build-tools;28.0.2", localVersion: "28.0.2", remoteVersion: "", description: "Android SDK Build-Tools 28.0.2", installed: true, update: false },
            { name: "ndk-bundle", localVersion: "21.3.6528147", remoteVersion: "21.4.6528147", description: "NDK", installed: true, update: true },
        ];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });

    it("real windows case", () => {
        const input = fs.readFileSync(`${__dirname}/fixture/complex-output.txt`).toString();
        const expected = [
            { name: "add-ons;addon-google_apis-google-22", localVersion: "", remoteVersion: "1", description: "Google APIs", installed: false, update: false },
            { name: "add-ons;addon-google_apis-google-23", localVersion: "1", remoteVersion: "1", description: "Google APIs", installed: true, update: false },
            { name: "add-ons;addon-google_apis-google-24", localVersion: "1", remoteVersion: "1", description: "Google APIs", installed: true, update: false },
            { name: "build-tools;19.1.0", localVersion: "", remoteVersion: "19.1.0", description: "Android SDK Build-Tools 19.1", installed: false, update: false },
            { name: "build-tools;29.0.2", localVersion: "", remoteVersion: "29.0.2", description: "Android SDK Build-Tools 29.0.2", installed: false, update: false },
            { name: "build-tools;29.0.3", localVersion: "29.0.3", remoteVersion: "29.0.3", description: "Android SDK Build-Tools 29.0.3", installed: true, update: false },
            { name: "build-tools;30.0.0", localVersion: "30.0.0", remoteVersion: "30.0.0", description: "Android SDK Build-Tools 30", installed: true, update: false },
            { name: "build-tools;30.0.1", localVersion: "", remoteVersion: "30.0.1", description: "Android SDK Build-Tools 30.0.1", installed: false, update: false },
            { name: "cmake;3.10.2.4988404", localVersion: "3.10.2", remoteVersion: "3.10.2", description: "CMake 3.10.2.4988404", installed: true, update: false },
            { name: "cmake;3.6.4111459", localVersion: "3.6.4111459", remoteVersion: "3.6.4111459", description: "CMake 3.6.4111459", installed: true, update: false },
            { name: "cmdline-tools;latest", localVersion: "", remoteVersion: "2.1", description: "Android SDK Command-line Tools (latest)", installed: false, update: false },
            { name: "emulator", localVersion: "", remoteVersion: "30.0.12", description: "Android Emulator", installed: false, update: false },
            { name: "extras;google;m2repository", localVersion: "58", remoteVersion: "58", description: "Google Repository", installed: true, update: false },
            { name: "extras;intel;Hardware_Accelerated_Execution_Manager", localVersion: "", remoteVersion: "7.5.6", description: "Intel x86 Emulator Accelerator (HAXM installer)", installed: false, update: false },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout-solver;1.0.1", localVersion: "", remoteVersion: "1", description: "Solver for ConstraintLayout 1.0.1", installed: false, update: false },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout-solver;1.0.2", localVersion: "1", remoteVersion: "1", description: "Solver for ConstraintLayout 1.0.2", installed: true, update: false },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout;1.0.1", localVersion: "", remoteVersion: "1", description: "ConstraintLayout for Android 1.0.1", installed: false, update: false },
            { name: "extras;m2repository;com;android;support;constraint;constraint-layout;1.0.2", localVersion: "1", remoteVersion: "1", description: "ConstraintLayout for Android 1.0.2", installed: true, update: false },
            { name: "ndk-bundle", localVersion: "21.3.6528147", remoteVersion: "21.4.6528148", description: "NDK", installed: true, update: true },
            { name: "ndk;19.2.5345600", localVersion: "", remoteVersion: "19.2.5345600", description: "NDK (Side by side) 19.2.5345600", installed: false, update: false },
            { name: "ndk;21.2.6472646", localVersion: "", remoteVersion: "21.2.6472646", description: "NDK (Side by side) 21.2.6472646", installed: false, update: false },
            { name: "ndk;21.3.6528147", localVersion: "", remoteVersion: "21.3.6528147", description: "NDK (Side by side) 21.3.6528147", installed: false, update: false },
            { name: "patcher;v4", localVersion: "1", remoteVersion: "1", description: "SDK Patch Applier v4", installed: true, update: false },
            { name: "platform-tools", localVersion: "30.0.4", remoteVersion: "30.0.4", description: "Android SDK Platform-Tools", installed: true, update: false },
            { name: "platforms;android-28", localVersion: "", remoteVersion: "6", description: "Android SDK Platform 28", installed: false, update: false },
            { name: "platforms;android-29", localVersion: "4", remoteVersion: "5", description: "Android SDK Platform 29", installed: true, update: true },
            { name: "platforms;android-30", localVersion: "2", remoteVersion: "2", description: "Android SDK Platform 30", installed: true, update: false },
            { name: "system-images;android-30;google_apis;x86", localVersion: "", remoteVersion: "7", description: "Google APIs Intel x86 Atom System Image", installed: false, update: false },
            { name: "system-images;android-30;google_apis;x86_64", localVersion: "", remoteVersion: "7", description: "Google APIs Intel x86 Atom_64 System Image", installed: false, update: false },
            { name: "tools", localVersion: "26.1.1", remoteVersion: "", description: "Android SDK Tools 26.1.1", installed: true, update: false },
        ] as AndroidPackageInfo[];
        const actual = parseSDKManagerOutput(input);
        expect(actual).toEqual(expected);
    });
});