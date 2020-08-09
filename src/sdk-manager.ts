import * as core from "@actions/core";
import * as exec from "@actions/exec";
import path from "path";
import { parseSDKManagerOutput, AndroidPackageInfo } from "./sdk-manager-parser";

export class SDKManager {
    private sdkManagerPath: string;

    constructor() {
        const androidHome = process.env.ANDROID_HOME;
        if (!androidHome) { throw new Error("ANDROID_HOME env variable is not defined"); }
        this.sdkManagerPath = `"${path.join(androidHome, "tools", "bin", "sdkmanager")}"`;
    }

    public async getAllPackagesInfo(): Promise<AndroidPackageInfo[]> {
        let stdout = "";
        const stdoutListener = (data: Buffer): void => { stdout += data.toString(); core.debug(data.toString()) };
        const options = { silent: true, listeners: { stdout: stdoutListener } };
        const exitCode = await exec.exec(this.sdkManagerPath, ["--list"], options);
        if (exitCode !== 0) {
            throw new Error(`'sdkmanager --list' has finished with exit code '${exitCode}'`);
        }

        return parseSDKManagerOutput(stdout);
    }
}