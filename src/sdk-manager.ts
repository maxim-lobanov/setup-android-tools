import * as core from "@actions/core";
import * as exec from "@actions/exec";
import path from "path";
import { parseSDKManagerOutput, AndroidPackageInfo } from "./sdk-manager-parser";
import { splitByEOL } from "./utils";

export class SDKManager {
    private sdkManagerPath: string;

    constructor(androidHome: string) {
        this.sdkManagerPath = `"${path.join(androidHome, "tools", "bin", "sdkmanager")}"`;
    }

    public async install(packageInfo: AndroidPackageInfo): Promise<void> {
        await this.run([packageInfo.name], true);
    }

    public async getAllPackagesInfo(): Promise<AndroidPackageInfo[]> {
        const stdout = await this.run(["--list"], false);
        const parsedPackages = parseSDKManagerOutput(stdout);
        if (core.isDebug()) {
            core.debug("Available packages:");
            parsedPackages.forEach(p => core.debug(JSON.stringify(p)));
        }

        return parsedPackages;
    }

    private async run(args: string[], printOutputInDebug: boolean): Promise<string> {
        let stdout = "";
        let previousPrintedLine = "";
        const outputListener = (data: Buffer): void => {
            const line = data.toString();
            stdout += line;

            if (printOutputInDebug) {
                splitByEOL(line).map(s => s.trim()).filter(Boolean).forEach(s => {
                    if (previousPrintedLine !== s) {
                        core.debug(s);
                        previousPrintedLine = s;
                    }
                });
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
        const commandString = `${this.sdkManagerPath.replace(/"/g, "")} ${args.join(" ")}`;
        console.log(`[command]${commandString}`);
        const exitCode = await exec.exec(this.sdkManagerPath, args, options);
        if (exitCode !== 0) {
            throw new Error(`'${commandString}' has finished with exit code '${exitCode}'`);
        }

        return stdout;
    }
}