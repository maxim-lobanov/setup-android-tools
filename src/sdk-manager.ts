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

    public async install(packageInfo: AndroidPackageInfo): Promise<void> {
        let stdout = "";
        const outputListener = (data: Buffer): void => {
            stdout += data.toString();
            splitSDKManagerOutput(data.toString()).forEach(line => core.debug(line));
        };
        const options: exec.ExecOptions = {
            silent: true,
            ignoreReturnCode: true,
            listeners: { stdout: outputListener, stderr: outputListener }
        };
        const exitCode = await exec.exec(this.sdkManagerPath, [packageInfo.name], options);
        if (exitCode !== 0) {
            throw new Error(`'sdkmanager ${packageInfo.name}' has finished with exit code '${exitCode}'`);
        }
        if (core.isDebug()) {
            splitSDKManagerOutput(stdout).forEach(line => core.debug(line));
        }
    }

    public async getAllPackagesInfo(): Promise<AndroidPackageInfo[]> {
        let stdout = "";
        const stdoutListener = (data: Buffer): void => {
            stdout += data.toString();
            //splitSDKManagerOutput(data.toString()).forEach(line => core.debug(line));
        };
        const options = { silent: true, listeners: { stdout: stdoutListener } };
        const exitCode = await exec.exec(this.sdkManagerPath, ["--list"], options);
        if (exitCode !== 0) {
            throw new Error(`'sdkmanager --list' has finished with exit code '${exitCode}'`);
        }

        const parsedPackages = parseSDKManagerOutput(stdout);
        if (core.isDebug()) {
            //core.debug("Parsed packages:");
            //parsedPackages.forEach(p => core.debug(JSON.stringify(p)));
        }

        return parsedPackages;
    }
}