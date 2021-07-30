export namespace stringUtils {
    export function isEmpty(val: string | undefined | null) {
        if (val) {
            return val.trim() === "";
        }
        return true;
    }

    export function trimStart(val: string): string {
        return val.replace(/^[\s\r\n]+/, "");
    }

    export function trimEnd(val: string): string {
        return val.replace(/[\s\r\n]+$/, "");
    }

    export function trimAll(val: string): string {
        return val.replace(/[\s\r\n]+/g, "");
    }
}
