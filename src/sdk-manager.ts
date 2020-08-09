import * as core from "@actions/core";
import * as exec from "@actions/exec";
import path from "path";
import { parseSDKManagerOutput, AndroidPackageInfo, splitSDKManagerOutput } from "./sdk-manager-parser";

export class SDKManager {
    private sdkManagerPath: string;

    constructor() {
        const androidHome = process.env.ANDROID_HOME;
        if (!androidHome) { throw new Error("ANDROID_HOME env variable is not defined"); }
        this.sdkManagerPath = `"${path.join(androidHome, "tools", "bin", "sdkmanager")}"`;
    }

    public async getAllPackagesInfo(): Promise<AndroidPackageInfo[]> {
        let stdout = "";
        const stdoutListener = (data: Buffer): void => { stdout += data.toString(); };
        const options = { silent: true, listeners: { stdout: stdoutListener } };
        const exitCode = await exec.exec(this.sdkManagerPath, ["--list"], options);
        if (core.isDebug()) {
            splitSDKManagerOutput(stdout).forEach(line => core.debug(line));
        }
        if (exitCode !== 0) {
            throw new Error(`'sdkmanager --list' has finished with exit code '${exitCode}'`);
        }

        const parsedPackages = parseSDKManagerOutput(stdout);
        if (core.isDebug()) {
            core.debug("Parsed packages:");
            parsedPackages.forEach(p => core.debug(JSON.stringify(p)));
        }

        return parsedPackages;
    }
}