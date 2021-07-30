import { Watcher } from "./watcher";
import { arrayUtils, idUtils } from "@joker/shared";

/**
 * 作为观察者和对象代理中间的关系桥
 * 数据变更时：Ob->dep->watcher
 * 设置依赖时：watcher->dep
 */
export class Dep {
    public static target?: Watcher;
    public id: string;

    constructor() {
        //这里使用自建ID规则，不用symbol，因为在watcher里面有多级索引，还没有string快
        this.id = idUtils.guid();
    }

    public datas: any = {};

    public depend(key: string | symbol) {
        if (Dep.target) Dep.target.addDep(this, key);
    }

    public addSub(watcher: Watcher, key: string | symbol) {
        this.datas[key] = this.datas[key] || [];

        this.datas[key].push(watcher);
    }
    public removeSub(watcher: Watcher, key: string | symbol) {
        if (this.datas[key]) {
            arrayUtils.without(this.datas[key], watcher);
        }
    }
    public notify(key: string | symbol) {
        if (this.datas[key]) {
            //先进先出
            this.datas[key].forEach((item: Watcher) => {
                item.update();
            });
        }
    }
}
