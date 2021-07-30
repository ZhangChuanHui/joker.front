export namespace idUtils {
    let _baseId: number = 0;

    export function guid() {
        return "guid_" + _baseId++ + "_" + new Date().getTime() + Math.ceil(Math.random() * 10000);
    }
}
