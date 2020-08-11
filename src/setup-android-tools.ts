import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as os from "os";
import * as fs from "fs";
import { SDKManager } from "./sdk-manager";
import { splitByEOL } from "./utils";

const getListInput = (inputName: string): string[] => {
    const value = core.getInput(inputName);
    return splitByEOL(value).map(s => s.trim()).filter(Boolean);
};

const patchUbuntuPermissions = async(androidHome: string): Promise<void> => {
    core.info("Patch permissions for $ANDROID_HOME on Ubuntu");
    await exec.exec("sudo", ["chmod", "-R", "a+rwx", androidHome]);
};

const run = async(): Promise<void> => {
    try {
        const androidHome = process.env.ANDROID_HOME;
        if (!androidHome) { throw new Error("ANDROID_HOME env variable is not defined"); }

        if (os.platform() === "linux") {
            await patchUbuntuPermissions(androidHome);
        }

        const sdkmanager = new SDKManager(androidHome);
        const allPackages = await sdkmanager.getAllPackagesInfo();

        const packages = getListInput("packages");
        for (const packageName of packages) {
            core.info(`Installing '${packageName}'...`);
            const foundPackage = allPackages.find(p => p.name === packageName);
            if (!foundPackage) {
                throw new Error(`  Package '${packageName}' is not available. Enable debug output for more details.`);
            }

            if (foundPackage.installed && !foundPackage.update) {
                core.info(`Package '${foundPackage.name}' is already installed and update is not required`);
                continue;
            }

            await sdkmanager.install(foundPackage);

            const localPackagePath = sdkmanager.getPackagePath(foundPackage);
            console.log(localPackagePath);
            console.log(fs.existsSync(localPackagePath));
            console.log(fs.readdirSync(localPackagePath).join(", "));
        }
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
