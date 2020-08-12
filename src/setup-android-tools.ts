import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as os from "os";
import { SDKManager } from "./sdk-manager";
import { getListInput, getBooleanInput } from "./utils";

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

        const enableCache = getBooleanInput("cache");
        const packages = getListInput("packages");
        for (const packageName of packages) {
            core.info(`Installing '${packageName}'...`);
            const foundPackage = allPackages.find(p => p.name === packageName);
            if (!foundPackage) {
                throw new Error(`Package '${packageName}' is not available. Enable debug output for more details.`);
            }

            if (foundPackage.installed && !foundPackage.update) {
                core.info(`  Package '${foundPackage.name}' is already installed and update is not required`);
                continue;
            }

            const cacheKey = `${foundPackage.name} ${foundPackage.remoteVersion}/1`;
            const localPackagePath = sdkmanager.getPackagePath(foundPackage);

            let cacheHit = false;
            if (enableCache) {
                core.startGroup("  Trying to restore package from cache...");
                const cacheHitKey = await cache.restoreCache([localPackagePath], cacheKey);
                cacheHit = Boolean(cacheHitKey);
                if (cacheHit && !sdkmanager.isPackageInstalled(foundPackage)) {
                    core.debug("  [WARNING] Cache is invalid and contains empty folder. ");
                    cacheHit = false;
                }
                core.endGroup();
            }

            if (cacheHit) {
                core.info(`  Package '${foundPackage.name}' is restored from cache`);
                continue;
            } else {
                core.info("  No cache found");
            }

            core.startGroup("  Trying to download package via sdkmanager...");
            await sdkmanager.install(foundPackage);
            core.endGroup();
            core.info(`  Package '${foundPackage.name}' is downloaded and installed`);

            if (!sdkmanager.isPackageInstalled(foundPackage)) {
                throw new Error(`Package '${packageName}' was not installed properly. '${localPackagePath}' folder is empty and doesn't exist`);
            }

            if (enableCache) {
                core.startGroup("  Saving package to cache...");
                await cache.saveCache([localPackagePath], cacheKey);
                core.endGroup();
                core.info(`  Package '${foundPackage.name}' is saved to cache`);
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
