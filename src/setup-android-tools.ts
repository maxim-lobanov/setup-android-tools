import * as core from "@actions/core";
import { SDKManager } from "./sdk-manager";

const run = async(): Promise<void> => {
    try {
        const sdkmanager = new SDKManager();
        const allPackages = await sdkmanager.getAllPackagesInfo();
        core.info(JSON.stringify(allPackages));
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
