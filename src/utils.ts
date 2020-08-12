import * as core from "@actions/core";
import { AndroidPackageInfo } from "./sdk-manager-parser";

export const splitByEOL = (stdout: string): string[] => {
    return stdout.split(/[\r\n]/);
};

export const getListInput = (inputName: string): string[] => {
    const value = core.getInput(inputName);
    return splitByEOL(value).map(s => s.trim()).filter(Boolean);
};

export const getBooleanInput = (inputName: string): boolean => {
    return (core.getInput(inputName) || "false").toUpperCase() === "TRUE";
};

export const getPackageCacheKey = (packageInfo: AndroidPackageInfo): string => {
    return `${packageInfo.name} ${packageInfo.remoteVersion}/1`;
}