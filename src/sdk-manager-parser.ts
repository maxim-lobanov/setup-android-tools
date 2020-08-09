import * as core from "@actions/core";

export interface AndroidPackageInfo {
    name: string;
    localVersion: string;
    remoteVersion: string;
    description: string;
    installed: boolean;
    update: boolean;
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
    default:
        if (core.isDebug()) { core.debug(`Unknown state '${line}'`); }
        return "None";
    }
};

export const splitSDKManagerOutput = (stdout: string): string[] => {
    return stdout.split(/[\r\n]/);
};

export const parseSDKManagerOutput = (stdout: string): AndroidPackageInfo[] => {
    const result: AndroidPackageInfo[] = [];

    let state: ParserState = "None";

    const pushPackage = (packet: Partial<AndroidPackageInfo> & Pick<AndroidPackageInfo, "name">): void => {
        const defaultPackage: AndroidPackageInfo = { name: packet.name, description: "", localVersion: "", remoteVersion: "", installed: false, update: false };
        const packageIndex = result.findIndex(p => p.name === packet.name);
        if (packageIndex >= 0) {
            result[packageIndex] = { ...result[packageIndex], ...packet };
        } else {
            result.push({...defaultPackage, ...packet });
        }
    };

    const lines = splitSDKManagerOutput(stdout);
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
        if (state === "InstalledPackages") {
            pushPackage({
                name: cols[0],
                localVersion: cols[1],
                description: cols[2],
                installed: true
            });
        }
        if (state === "AvailablePackages") {
            pushPackage({
                name: cols[0],
                remoteVersion: cols[1],
                description: cols[2]
            });
        } else if (state === "AvailableUpdates") {
            pushPackage({
                name: cols[0],
                localVersion: cols[1],
                remoteVersion: cols[2],
                installed: true,
                update: true
            });
        }
    }

    return result.sort((p1, p2) => p1.name.localeCompare(p2.name));
};