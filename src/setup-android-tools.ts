import * as core from "@actions/core";
import * as os from "os";
import { SDKManager } from "./sdk-manager";
import { splitByEOL } from "./sdk-manager-parser";

const getListInput = (inputName: string): string[] => {
    const value = core.getInput(inputName);
    return splitByEOL(value).map(s => s.trim()).filter(Boolean);
};

const getBooleanInput = (inputName: string): boolean => {
    return (core.getInput(inputName) || "false").toUpperCase() === "TRUE";
};

const run = async(): Promise<void> => {
    try {
        const packagesToInstall = getListInput("packages");
        const cache = getBooleanInput("cache");
        core.debug(String(cache));

        if (os.platform() === "linux") {
            // fix permissions
            // sudo chmod -R a+rwx ${ANDROID_HOME}/ndk
        }

        const sdkmanager = new SDKManager();
        const packages = await sdkmanager.getAllPackagesInfo();
        for (const packageName of packagesToInstall) {
            const foundPackage = packages.find(p => p.name === packageName);
            if (!foundPackage) {
                throw new Error(`Package '${packageName}' is not available. Enable debug output for more details.`);
            }

            await sdkmanager.install(foundPackage);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
