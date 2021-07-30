import { objectUtils } from "@joker/shared";
import { Dep } from "./dep";

const PROXYOBDEP = "__PROXY_OB_DEP__";
const PROXYOBDEPID = Symbol("PROXYOBDEPID");

/**
 * 作为对象的代理，监听属性变化，和属性变更通知，对接view底层
 */
export class Observer<T extends object> {
    public proxyObj: T;
    constructor(data: T, clone?: boolean) {
        if (Observer.checkEnableProxy(data)) {
            if (clone) {
                let cloneObj = objectUtils.clone(data);

                this.proxyObj = this.proxyData(cloneObj) as T;
            } else {
                this.proxyObj = this.proxyData(data) as T;
            }
        } else {
            throw new Error("当前传入的数据不是正确的数据类型，必须是数组或者对象");
        }
    }

    public static getProxyDepTarget(obj: any): Dep | undefined {
        if (objectUtils.hasOwn(obj, PROXYOBDEP) && obj[PROXYOBDEP] instanceof Dep) {
            return obj[PROXYOBDEP];
        }

        return;
    }
    public static setProxyDepTarget(obj: Object, dep: Dep) {
        Object.defineProperty(obj, PROXYOBDEP, {
            value: dep,
            enumerable: false,
            writable: true,
            configurable: true
        });
    }

    private proxyData(obj: any) {
        //如果存在历史Ob 则按照历史Ob处理
        let hasDep = Observer.getProxyDepTarget(obj);
        if (hasDep) return obj;

        let depItem = new Dep();

        for (let key in obj) {
            if (Observer.checkEnableProxy(obj[key])) {
                obj[key] = this.proxyData(obj[key]);
            }
        }

        let proxyHandler = {
            get(target: any, key: string | symbol, receiver: any) {
                let result = target[key];

                if (key === PROXYOBDEPID || key === PROXYOBDEP) return result;

                depItem.depend(key);

                if (Observer.checkEnableProxy(result)) {
                    //如果是可劫持对象，并且存在Dep关系，则做深度为1的空key关系
                    let dep = Observer.getProxyDepTarget(result);

                    if (dep) {
                        dep.depend(PROXYOBDEPID);
                    }
                }

                return result;
            },
            set(target: object, key: string | symbol, value: any): boolean {
                if (Observer.checkEnableProxy(value)) {
                    //如果是对象，则对其进行数据依赖采集
                    value = new Observer(value).proxyObj;
                }

                let isNewProperty = !objectUtils.hasOwn(target, key);

                let result = Reflect.set(target, key, value);

                if (result) {
                    depItem.notify(key);

                    //数组长度变更，属于数组change，则对该对象做change广播
                    if (Array.isArray(target)) {
                        key === "length" && depItem.notify(PROXYOBDEPID);
                    } else if (isNewProperty) {
                        //Object 类型，监听新属性增加
                        depItem.notify(PROXYOBDEPID);
                    }
                }
                return result;
            },
            deleteProperty(target: object, key: string | symbol): boolean {
                let result = Reflect.deleteProperty(target, key);

                //操作成功 && 非数组，删除属性时，要进行广播
                if (result && Array.isArray(target) === false) {
                    depItem.notify(PROXYOBDEPID);
                }

                return result;
            }
        };

        Observer.setProxyDepTarget(obj, depItem);

        return new Proxy(obj, proxyHandler);
    }

    public static checkEnableProxy(data: any): boolean {
        return (
            objectUtils.isObject(data) &&
            (Array.isArray(data) || objectUtils.isPlainObject(data)) &&
            Object.isExtensible(data)
        );
    }

    /**
     * 向对象中添加一个需要劫持的属性，并对该属性进行深度劫持
     * @param target 要配置的数据对象
     * @param key 要添加的KEY
     */
    public static defineProperty(target: any, key: string, val: any) {
        let depItem = new Dep();
        let propertyVal: any;
        if (Observer.checkEnableProxy(val)) {
            //如果是对象，则对其进行数据依赖采集
            propertyVal = new Observer(val).proxyObj;
        } else {
            propertyVal = val;
        }

        Object.defineProperty(target, key, {
            //可枚举
            enumerable: true,
            //不可再定义
            configurable: true,
            get: () => {
                depItem.depend(key);

                if (Observer.checkEnableProxy(propertyVal)) {
                    //如果是可劫持对象，并且存在Dep关系，则做深度为1的空key关系
                    let dep = Observer.getProxyDepTarget(propertyVal);

                    if (dep) {
                        dep.depend(PROXYOBDEPID);
                    }
                }

                return propertyVal;
            },
            set: (value) => {
                if (value === propertyVal) return;

                if (Observer.checkEnableProxy(value)) {
                    //如果是对象，则对其进行数据依赖采集
                    value = new Observer(value).proxyObj;
                }
                propertyVal = value;

                depItem.notify(key);
            }
        });
    }
}
