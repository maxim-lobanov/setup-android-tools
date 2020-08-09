import * as core from "@actions/core";
import * as exec from "@actions/exec";
import path from "path";

export interface PackageInfo {
    name: string;
    version: string;
    description: string;
}

export class SDKManager {
    private sdkManagerPath: string;

    constructor() {
        const androidHome = process.env.ANDROID_HOME;
        if (!androidHome) { throw new Error("ANDROID_HOME env variable is not defined"); }
        this.sdkManagerPath = `"${path.join(androidHome, "tools", "bin", "sdkmanager")}"`;
        // macOS
        // SDKMANAGER=$ANDROID_HOME/tools/bin/sdkmanager
        // Ubuntu
        // SDKMANAGER=$ANDROID_HOME/tools/bin/sdkmanager
        // Windows
        // SDKMANAGER=$ANDROID_HOME\tools\bin\sdkmanager.bat
    }

    async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
        let stdout = packageName;
        core.info(this.sdkManagerPath);
        const stdoutListener = (data: Buffer): void => { stdout += data.toString(); };
        const exitCode = await exec.exec(this.sdkManagerPath, ["--list"], { listeners: { stdout: stdoutListener } });
        if (exitCode !== 0) {
            throw new Error(`'sdkmanager --list' has finished with exit code '${exitCode}'`);
        }
        core.info(stdout);


        return null;
    }
}