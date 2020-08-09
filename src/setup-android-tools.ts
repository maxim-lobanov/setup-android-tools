import * as core from "@actions/core";
import { SDKManager } from "./sdk-manager";
import { EOL } from "os";

const getListInput = (inputName: string): string[] => {
    const value = core.getInput(inputName);
    return value.split(EOL).map(s => s.trim()).filter(Boolean);
};

const getBooleanInput = (inputName: string): boolean => {
    return (core.getInput(inputName) || "false").toUpperCase() === "TRUE";
};

const run = async(): Promise<void> => {
    try {
        const packagesToInstall = getListInput("packages");
        const cache = getBooleanInput("cache");
        core.debug(String(cache));

        const sdkmanager = new SDKManager();
        const packages = await sdkmanager.getAllPackagesInfo();
        packagesToInstall.forEach(packageName => {
            const foundPackage = packages.find(p => p.name === packageName);
            if (!foundPackage) {
                throw new Error(`Package '${packageName}' is not available. Enable debug output for more details.`);
            }

            sdkmanager.install(foundPackage);
        });
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
