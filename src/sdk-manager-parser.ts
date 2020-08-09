import * as core from "@actions/core";
import { EOL } from "os";

export interface AndroidPackageInfo {
    name: string;
    version: string;
    description: string;
    installed: boolean;
    update: string | null;
}

export type ParserState = "InstalledPackages" | "AvailablePackages" | "AvailableUpdates" | "None";

export const getNewState = (line: string): ParserState | null => {
    if (!/^[\w ]+:$/.test(line)) {
        return null;
    }

    switch(line) {
    case "Installed packages:": return "InstalledPackages";
    case "Available Packages:": return "AvailablePackages";
    case "Available Updates:": return "AvailableUpdates";
    default: core.debug(`Unknown state '${line}'`); return "None";
    }
};

export const parseSDKManagerOutput = (stdout: string): AndroidPackageInfo[] => {
    const result: AndroidPackageInfo[] = [];

    let state: ParserState = "None";

    const pushPackage = (packet: Partial<AndroidPackageInfo> & Pick<AndroidPackageInfo, "name">): void => {
        const defaultPackage: AndroidPackageInfo = { name: packet.name, description: "", version: "", installed: false, update: null };
        const packageIndex = result.findIndex(p => p.name === packet.name);
        if (packageIndex >= 0) {
            result[packageIndex] = { ...result[packageIndex], ...packet };
        } else {
            result.push({...defaultPackage, ...packet });
        }
    };

    const lines = stdout.split(EOL);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex].trim();
        if (line.length === 0) {
            state = "None";
            continue;
        }

        const nextState = getNewState(line);
        if (nextState) {
            state = nextState;
            // Skip the next 2 lines: table header and table header delimeter
            lineIndex += 2;
            continue;
        }

        const cols = line.split("|").filter(Boolean).map(s => s.trim());
        if (cols[0] === "platforms;android-29") {
            console.log(line);
        }
        if (state === "InstalledPackages") {
            pushPackage({
                name: cols[0],
                version: cols[1],
                description: cols[2],
                installed: true
            });
        }
        if (state === "AvailablePackages") {
            pushPackage({
                name: cols[0],
                version: cols[1],
                description: cols[2]
            });
        } else if (state === "AvailableUpdates") {
            pushPackage({
                name: cols[0],
                version: cols[1],
                update: cols[2],
            });
        }
    }

    return result.sort((p1, p2) => p1.name.localeCompare(p2.name));
};