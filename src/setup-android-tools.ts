import * as core from "@actions/core";
import { SDKManager } from "./sdk-manager";

const run = async(): Promise<void> => {
    try {
        core.info("Hello");
        const sdkmanager = new SDKManager();
        await sdkmanager.getPackageInfo("");
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
