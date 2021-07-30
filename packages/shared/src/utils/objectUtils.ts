export namespace objectUtils {
    export function isEmpty(object: any): boolean {
        if (isObject(object)) {
            for (let key in object) {
                return false;
            }

            return true;
        }
        return false;
    }
    /**
     * 是否是对象
     */
    export function isObject(object: any): boolean {
        return object !== null && typeof object === "object";
    }

    /**
     * 是否具有原型链
     */
    export function hasProto(value: any): boolean {
        return !!value.__proto__;
    }

    export function getOwnProperties(obj: any, callBack: (key: string, val: any) => boolean | void) {
        let ownKeys = Object.getOwnPropertyNames(obj);

        ownKeys.forEach((key) => {
            if (callBack(key, obj[key]) === false) return;
        });
    }

    /**
     * 设置属性值
     */
    export function def(obj: any, key: string, val: any, enumerable: boolean) {
        Object.defineProperty(obj, key, {
            value: val,
            enumerable: enumerable,
            writable: true,
            configurable: true
        });
    }

    /**
     * 对象自身属性中是否具有指定的属性，支持属性索引
     */
    export function hasOwn(obj: object, key: string | symbol): boolean {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }
    /**
     * 判断指定参数是否是一个纯粹的对象
     */
    export function isPlainObject(obj: any): boolean {
        return Object.prototype.toString.call(obj) === "[object Object]";
    }

    /**
     * 克隆对象
     * @param obj 目标对象
     * @returns 新对象
     */
    export function clone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }
}
