import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import { parseSDKManagerOutput, AndroidPackageInfo } from "./sdk-manager-parser";
import { splitByEOL } from "./utils";

export class SDKManager {
    private sdkManagerPath: string;

    constructor(private androidHome: string) {
        this.sdkManagerPath = path.join(androidHome, "tools", "bin", "sdkmanager");
    }

    public async install(packageInfo: AndroidPackageInfo): Promise<void> {
        core.startGroup("Trying to download package via sdkmanager...");
        await this.run([packageInfo.name], true);
        core.endGroup();

        if (!this.isPackageInstalled(packageInfo)) {
            const localPackagePath = this.getPackagePath(packageInfo);
            throw new Error(`Package '${packageInfo.name}' was not installed properly. '${localPackagePath}' folder is empty and doesn't exist`);
        }
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

    public getPackagePath(packageInfo: AndroidPackageInfo): string {
        const relativePath = packageInfo.name.replace(/;/g, "/");
        return path.join(this.androidHome, relativePath);
    }

    public isPackageInstalled(packageInfo: AndroidPackageInfo): boolean {
        const packagePath = this.getPackagePath(packageInfo);
        if (!fs.existsSync(packagePath)) {
            return false;
        }

        return fs.readdirSync(packagePath).length > 0;
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
            input: Buffer.from("y") // accept license
        };
        const commandString = `${this.sdkManagerPath} ${args.join(" ")}`;
        console.log(`[command]${commandString}`);

        let exitCode;
        if (os.platform() === "linux") {
            exitCode = await exec.exec("sudo", [this.sdkManagerPath, ...args], options);
        } else {
            exitCode = await exec.exec(`"${this.sdkManagerPath}"`, args, options);
        }
        
        if (exitCode !== 0) {
            throw new Error(`'${commandString}' has finished with exit code '${exitCode}'`);
        }

        return stdout;
    }
}