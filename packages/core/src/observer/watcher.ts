import { objectUtils } from "@joker/shared";
import { Dep } from "./dep";

/**
 * 作为观察者，唯一对外使用的操作对象
 */
export class Watcher {
    private getter?: Function;
    public value: any;
    public deps: { [depId: string]: any } = {};
    public runDeps: { [depId: string]: any } = {};

    constructor(
        private vData: object | undefined,
        protected expOrFn: string | Function,
        private updateCallBack: Function,
        private igChangeCheck?: boolean
    ) {
        if (expOrFn instanceof Function) {
            this.getter = expOrFn;
        } else if (typeof expOrFn === "string") {
            this.getter = transformGetter(expOrFn);
        }

        if (vData === undefined) throw new Error("vData不能为undefined");

        if (this.getter === undefined) throw new Error("未解析出getter方法");

        this.value = this.get();
    }
    public get() {
        Dep.target = this;
        let value = this.getter?.call(this.vData, this.vData);
        Dep.target = undefined;

        this.clearnDeps();
        return value;
    }

    public addDep(dep: Dep, key: string | symbol) {
        let runDepItem = this.runDeps[dep.id];
        if (runDepItem === undefined || runDepItem[key] === undefined) {
            runDepItem = this.runDeps[dep.id] = this.runDeps[dep.id] || {};
            runDepItem[key] = dep;

            let depItem = this.deps[dep.id];
            if (depItem === undefined || depItem[key] === undefined) {
                dep.addSub(this, key);
            }
        }
    }

    public update() {
        let value = this.get();

        let oldValue = this.value;

        if (this.igChangeCheck) {
            this.updateCallBack(value, oldValue);
        } else if (value !== oldValue || objectUtils.isObject(value)) {
            this.value = value;

            this.updateCallBack(value, oldValue);
        }
    }

    public dispose() {
        for (let depId in this.deps) {
            for (let key in this.deps[depId]) {
                this.deps[depId][key].removeSub(this, key);
            }
        }

        this.deps = {};
        this.runDeps = {};
        this.vData = undefined;
        this.value = undefined;
        this.getter = undefined;
    }

    private clearnDeps() {
        for (let depId in this.deps) {
            let runDepItem = this.runDeps[depId];
            if (runDepItem === undefined) {
                for (let key in this.deps[depId]) {
                    this.deps[depId][key].removeSub(this, key);
                }
            } else {
                for (let key in this.deps[depId]) {
                    if (runDepItem[key] === undefined) this.deps[depId][key].removeSub(this, key);
                }
            }
        }

        this.deps = this.runDeps;

        this.runDeps = {};
    }
}

function transformGetter(exp: string): Function | undefined {
    //过滤非正常属性
    if (/[^\w.$]/.test(exp)) return;

    let exps = exp.split(".");

    return function (data: object) {
        let result: any = data;
        exps.forEach((key) => {
            if (!result) return;

            result = result[key];
        });

        return result;
    };
}
