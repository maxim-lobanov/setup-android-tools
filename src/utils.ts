import * as core from "@actions/core";

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