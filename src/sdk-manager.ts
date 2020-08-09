import * as core from "@actions/core";
import * as exec from "@actions/exec";
import path from "path";
import { parseSDKManagerOutput, AndroidPackageInfo } from "./sdk-manager-parser";
import { splitByEOL } from "./utils";

export class SDKManager {
    private sdkManagerPath: string;

    constructor() {
        const androidHome = process.env.ANDROID_HOME;
        if (!androidHome) { throw new Error("ANDROID_HOME env variable is not defined"); }
        this.sdkManagerPath = `"${path.join(androidHome, "tools", "bin", "sdkmanager")}"`;
    }

    public async install(packageInfo: AndroidPackageInfo): Promise<void> {
        await this.run([packageInfo.name], true);
    }

    public async getAllPackagesInfo(): Promise<AndroidPackageInfo[]> {
        const stdout = await this.run(["--list"], false);
        const parsedPackages = parseSDKManagerOutput(stdout);
        if (core.isDebug()) {
            //core.debug("Parsed packages:");
            //parsedPackages.forEach(p => core.debug(JSON.stringify(p)));
        }

        return parsedPackages;
    }

    private async run(args: string[], printOutputInDebug: boolean): Promise<string> {
        let stdout = "";
        const outputListener = (data: Buffer): void => {
            stdout += data.toString();
            if (printOutputInDebug) {
                splitByEOL(data.toString()).map(s => s.trim()).filter(Boolean).forEach(s => core.debug(s));
            }
        };
        const options: exec.ExecOptions = {
            silent: true,
            ignoreReturnCode: true,
            failOnStdErr: false,
            listeners: {
                stdout: outputListener,
                stderr: outputListener,
            },
        };
        const exitCode = await exec.exec(this.sdkManagerPath, args, options);
        if (exitCode !== 0) {
            const executableName = path.basename(this.sdkManagerPath);
            throw new Error(`'${executableName} ${args.join(" ")}' has finished with exit code '${exitCode}'`);
        }

        return stdout;
    }
}