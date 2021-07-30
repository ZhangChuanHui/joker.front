export namespace arrayUtils {
    export function without<T>(arr: Array<T>, filter: ((item: T) => boolean) | T): Array<T> {
        let index = -1;
        if (typeof filter === "function") {
            index = arr.findIndex((item: T) => (<Function>filter)(item));
        } else {
            index = arr.indexOf(filter);
        }
        if (index > -1) arr.splice(index, 1);

        return arr;
    }
}
