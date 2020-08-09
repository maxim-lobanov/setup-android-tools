import * as core from "@actions/core";
import { SDKManager } from "./sdk-manager";

const run = async(): Promise<void> => {
    try {
        const sdkmanager = new SDKManager();
        await sdkmanager.getAllPackagesInfo();
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
