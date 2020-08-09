export const splitByEOL = (stdout: string): string[] => {
    return stdout.split(/[\r\n]/);
};