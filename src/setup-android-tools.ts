import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as os from "os";
import { SDKManager } from "./sdk-manager";
import { getListInput, getBooleanInput, getPackageCacheKey } from "./utils";
import { AndroidPackageInfo } from "./sdk-manager-parser";

const patchUbuntuPermissions = async(androidHome: string): Promise<void> => {
    core.startGroup("Patch permissions for $ANDROID_HOME on Ubuntu");
    await exec.exec("sudo", ["chmod", "-R", "a+rwx", androidHome]);
    core.endGroup();
};

const restoreCache = async(sdkmanager: SDKManager, foundPackage: AndroidPackageInfo): Promise<boolean> => {
    core.startGroup("Trying to restore package from cache...");

    const cacheKey = getPackageCacheKey(foundPackage);
    const localPackagePath = sdkmanager.getPackagePath(foundPackage);
    const cacheHitKey = await cache.restoreCache([localPackagePath], cacheKey);

    let cacheHit = Boolean(cacheHitKey);
    if (cacheHit && !sdkmanager.isPackageInstalled(foundPackage)) {
        core.debug("  [WARNING] Cache is invalid and contains empty folder. ");
        cacheHit = false;
    }
    core.endGroup();

    return cacheHit;
};

const saveCache = async(sdkmanager: SDKManager, packageInfo: AndroidPackageInfo): Promise<void> => {
    core.startGroup("Saving package to cache...");

    const cacheKey = getPackageCacheKey(packageInfo);
    const localPackagePath = sdkmanager.getPackagePath(packageInfo);

    await cache.saveCache([localPackagePath], cacheKey);
    core.endGroup();
};

const run = async(): Promise<void> => {
    try {
        const enableCache = getBooleanInput("cache");
        const packages = getListInput("packages");

        const androidHome = process.env.ANDROID_HOME;
        if (!androidHome) { throw new Error("ANDROID_HOME env variable is not defined"); }
        const sdkmanager = new SDKManager(androidHome);

        if (os.platform() === "linux") {
            await patchUbuntuPermissions(androidHome);
        }

        core.startGroup("Getting list of available components");
        const allPackages = await sdkmanager.getAllPackagesInfo();
        core.endGroup();

        for (const packageName of packages) {
            core.info(`${os.EOL}Installing '${packageName}'...`);
            const foundPackage = allPackages.find(p => p.name === packageName);
            if (!foundPackage) {
                throw new Error("Package is not available. Enable debug output for more details");
            }

            if (foundPackage.installed && !foundPackage.update) {
                core.info("  Package is already installed and update is not required");
                continue;
            }

            if (enableCache) {
                if (await restoreCache(sdkmanager, foundPackage)) {
                    core.info("  Package is restored from cache");
                    continue;
                } else {
                    core.info("  No cache found");
                }
            }

            await sdkmanager.install(foundPackage);
            core.info("  Package is downloaded and installed");

            if (enableCache) {
                await saveCache(sdkmanager, foundPackage);
                core.info(`  Package is saved to cache`);
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
