import { EXPRESSHANDLERTAG } from "@joker/ast/src/dynamic/express";
import { arrayUtils } from "@joker/shared";
import { Component } from "@joker/core/src/component";
import { Observer } from "@joker/core/src/observer/observer";
import { Watcher } from "@joker/core/src/observer/watcher";

const ud = Symbol(2);
class TestView extends Component {
    model = {
        attr1: "v1",
        obj: {
            a: "1",
            [ud]: "2"
        },
        arr: [1, 2, 3, 4]
    };

    test = "2";
}

function mainTest() {
    let obj1 = new TestView().ComponentInitialize();
    let c1: string, c2: string, c3: number;
    let w1 = new Watcher(obj1, "model.attr1", (val: any) => {
        c1 = val;
    });

    let w2 = new Watcher(obj1, createExpress("context.model.obj.a"), (val: any) => {
        c2 = val;
    });

    let w3 = new Watcher(obj1, createExpress("context.model.arr[2]"), (val: any) => {
        c3 = val;
    });

    if (w1.value === "v1" && w2.value === "1" && w3.value === 3) {
        obj1.model.attr1 = "c1";
        obj1.model.obj.a = "c2";
        obj1.model.arr[2] = 4;

        return c1 === "c1" && c2 === "c2" && c3 === 4;
    }
    return false;
}

function arrayTest() {
    //#region 数据准备
    let ob = new TestView();
    ob.ComponentInitialize();

    let changelValue: number = 0;
    let changeArr: boolean = false;
    let changeLength: boolean = false;

    function clear() {
        changelValue = 0;
        changeArr = false;
        changeLength = false;
    }

    let watcher = new Watcher(ob, createExpress("context.model.arr[2]"), (val: any) => {
        changelValue = val;
    });

    new Watcher(ob, createExpress("context.model.arr"), (val: any) => {
        changeArr = true;
    });

    new Watcher(ob, createExpress("context.model.arr.length"), (val: any) => {
        changeLength = true;
    });

    //#endregion

    //#region 依赖采集项验证
    let depsValues = Object.values(watcher.deps);
    if ((depsValues.length === 2 && depsValues[0].arr && depsValues[1]["2"]) === false)
        throw new Error("arrayTest, 依赖采集项验证出错");
    //#endregion

    //#region 【改】索引项值变更
    clear();
    ob.model.arr[2] = 6;

    if (changelValue !== 6 && watcher.value === 6) throw new Error("arrayTest, 索引项值变更出错");
    //#endregion

    //#region 【增】变更非采集项，检测依赖采集是否会触发
    clear();
    ob.model.arr.push(5);

    if ((changelValue === 0 && watcher.value === 6 && changeArr && changeLength) === false)
        throw new Error("arrayTest, 变更非采集项出错");

    //#endregion

    //#region 【删】
    clear();
    arrayUtils.without(ob.model.arr, 2);

    if ((changelValue === 4 && changeArr && changeLength) === false) throw new Error("arrayTest, 数组值删除监听出错");
    //#endregion

    //#region 【替】
    clear();

    ob.model.arr = [8, 7, 6, 5, 0, 2];

    if ((changelValue === 6 && changeArr && changeLength) === false) throw new Error("arrayTest, 数组值替换监听出错");
    //#endregion

    //#region 【特】特殊语法
    clear();

    ob.model.arr.unshift(9);

    if ((changelValue === 7 && changeArr && changeLength) == false) throw new Error("arrayTest, 数组值头添加监听出错");

    clear();

    ob.model.arr.shift();

    if ((changelValue === 6 && changeArr && changeLength) === false) throw new Error("arrayTest, 数组值头删除监听出错");

    clear();
    ob.model.arr.length = 3;

    if ((changelValue === 0 && changeArr && changeLength) === false) throw new Error("arrayTest, 变更数组长度监听出错");
    //#endregion

    //#region 【破】破坏测试
    clear();
    watcher.dispose();

    ob.model.arr[2] = 10;

    if (changelValue !== 0) throw new Error("arrayTest, 破坏测试出错");

    //#endregion

    return true;
}

function objectTest() {
    let ob = new TestView();
    ob.ComponentInitialize();

    let objChange = false;
    let watcher = new Watcher(ob, createExpress("context.model.obj.a"), (val: any) => {});

    new Watcher(ob, createExpress("context.model.obj"), (val: any) => {
        objChange = true;
    });

    let udWatch = new Watcher(
        ob,
        function (context: TestView) {
            return context.model.obj[ud];
        },
        () => {}
    );

    function clear() {
        objChange = false;
    }

    //#region 【改】值变更
    ob.model.obj.a = "2";
    ob.model.obj[ud] = "4";
    if ((watcher.value === "2" && udWatch.value === "4" && objChange === false) === false)
        throw new Error("objectTest, 对象属性值变更监听出错");

    //#endregion

    //#region 【增】
    clear();
    ob.model.obj["b"] = {
        b1: "1"
    };

    if ((watcher.value === "2" && objChange && ob.model.obj["b"]) === false)
        throw new Error("objectTest, 对象属性值增加监听出错");

    //#endregion

    //#region 【删】
    clear();

    delete ob.model.obj.a;
    if ((ob.model.obj.a === undefined && watcher.value === undefined && objChange) === false)
        throw new Error("objectTest, 对象属性值删除监听出错");
    //#endregion

    //#region 【替】

    clear();

    ob.model.obj = {
        a: "3"
    } as any;

    if ((watcher.value === "3" && objChange) === false) throw new Error("objectTest, 对象属性值替换监听出错");
    //#endregion

    return true;
}

function ownObjectWatchTest() {
    let obj1 = new TestView();
    obj1.ComponentInitialize();
    let isPoChange = false;
    let poWatcher = new Watcher(
        obj1,
        function (context: TestView) {
            return context.model.obj.a;
        },
        () => {
            isPoChange = true;
        }
    );

    let isPoObjChange = false;
    let poObjChangeCount = 0;
    new Watcher(
        obj1,
        function (context: TestView) {
            return context.model.obj;
        },
        () => {
            isPoObjChange = true;
            poObjChangeCount++;
        }
    );

    let obj2 = Object.create(obj1);

    Observer.defineProperty(obj2, "item", obj1.model.obj);

    let isTestChange = false;
    let testWatcher = new Watcher(
        obj2,
        function (context: any) {
            return context.item.a;
        },
        () => {
            isTestChange = true;
        }
    );

    let isTestItemChange = false;
    new Watcher(
        obj2,
        function (context: any) {
            return context.item;
        },
        () => {
            isTestItemChange = true;
        }
    );

    function clear() {
        isPoChange = false;
        isTestChange = false;
        isTestItemChange = false;
        isPoObjChange = false;
        poObjChangeCount = 0;
    }

    //#region  Dep 重复定义校验
    let poKeys = Object.keys(poWatcher.deps);
    let testKeys = Object.keys(testWatcher.deps);

    let hasEqual = false;
    poKeys.forEach((key) => {
        if (testKeys.indexOf(key) > -1) hasEqual = true;
    });

    if ((testKeys.length === 2 && testKeys.length === 2 && hasEqual) === false)
        throw new Error("ownObjectWatchTest, Dep重复定义校验失败");
    //#endregion

    //#region  po/test值变更同步测试
    clear();

    obj1.model.obj.a = "2";

    if ((isPoChange && isTestChange && poWatcher.value === "2" && testWatcher.value === "2") === false)
        throw new Error("ownObjectWatchTest, po/test值变更同步测试失败,obj1.model.obj.a");

    clear();
    obj2.item.a = "1";

    if ((isPoChange && isTestChange && poWatcher.value === "1" && testWatcher.value === "1") === false)
        throw new Error("ownObjectWatchTest, po/test值变更同步测试失败,obj2.item.a");

    //#endregion

    //#region  新增/删除测试
    clear();

    (<any>obj1.model.obj).b = "2";

    if ((isPoObjChange && isTestItemChange && obj2.item.b === "2") === false)
        throw new Error("ownObjectWatchTest, 对象属性值新增测试失败");

    clear();

    delete (<any>obj1.model.obj).b;

    if ((isPoObjChange && isTestItemChange && obj2.item.b === undefined) === false)
        throw new Error("ownObjectWatchTest, 对象属性值删除测试失败");

    //#endregion

    //#region object 变更change测试测试
    clear();
    obj1.model.obj = {
        a: "a",
        b: "c",
        d: "d"
    } as any;

    if (
        (poObjChangeCount === 1 &&
            isPoObjChange &&
            isTestItemChange === false &&
            isTestChange === false &&
            obj1.model.obj !== obj2.item) === false
    )
        throw new Error("ownObjectWatchTest, obj1.model.obj变更测试失败");
    //#endregion
    return true;
}

function ownArrayWatchTest() {
    let obj1 = new TestView();
    obj1.ComponentInitialize();
    let isPoChange = false;
    let poWatcher = new Watcher(
        obj1,
        function (context: TestView) {
            return context.model.arr[2];
        },
        () => {
            isPoChange = true;
        }
    );

    let isPoArrChange = false;
    let poArrChangeCount = 0;
    new Watcher(
        obj1,
        function (context: TestView) {
            return context.model.arr;
        },
        () => {
            isPoArrChange = true;
            poArrChangeCount++;
        }
    );

    let obj2 = Object.create(obj1);

    Observer.defineProperty(obj2, "item", obj1.model.arr);

    let isTestChange = false;
    let testWatcher = new Watcher(
        obj2,
        function (context: any) {
            return context.item[2];
        },
        () => {
            isTestChange = true;
        }
    );

    let isTestItemChange = false;
    new Watcher(
        obj2,
        function (context: any) {
            return context.item;
        },
        () => {
            isTestItemChange = true;
        }
    );

    function clear() {
        isPoChange = false;
        isTestChange = false;
        isTestItemChange = false;
        isPoArrChange = false;
        poArrChangeCount = 0;
    }

    //#region  Dep 重复定义校验
    let poKeys = Object.keys(poWatcher.deps);
    let testKeys = Object.keys(testWatcher.deps);

    let hasEqual = false;
    poKeys.forEach((key) => {
        if (testKeys.indexOf(key) > -1) hasEqual = true;
    });

    if ((testKeys.length === 2 && testKeys.length === 2 && hasEqual) === false)
        throw new Error("ownArrayWatchTest, Dep重复定义校验失败");
    //#endregion

    //#region  po/test值变更同步测试
    clear();

    obj1.model.arr[2] = 6;

    if ((isPoChange && isTestChange && poWatcher.value === 6 && testWatcher.value === 6) === false)
        throw new Error("ownArrayWatchTest, po/test值变更同步测试失败,obj1.model.arr[2]");

    clear();

    obj2.item[2] = 2;

    if ((isPoChange && isTestChange && poWatcher.value === 2 && testWatcher.value === 2) === false)
        throw new Error("ownArrayWatchTest, po/test值变更同步测试失败,obj2.item[2]");

    //#endregion

    //#region  新增/删除测试
    clear();

    obj1.model.arr.push(6);

    if ((isPoArrChange && isTestItemChange) === false) throw new Error("ownArrayWatchTest, 数组值新增测试失败");

    clear();

    arrayUtils.without(obj2.item, 6);

    if ((isPoArrChange && isTestItemChange) === false) throw new Error("ownArrayWatchTest, 数组值删除测试失败");

    //#endregion

    //#region object 变更change测试测试
    clear();
    obj1.model.arr = [9, 8, 7, 6];

    if (
        (poArrChangeCount === 1 &&
            isPoArrChange &&
            isTestItemChange === false &&
            isTestChange === false &&
            obj1.model.obj !== obj2.item) === false
    )
        throw new Error("ownArrayWatchTest, obj1.model.arr变更测试失败");
    //#endregion
    return true;
}

test("next/observer 依赖采集", () => {
    expect(mainTest()).toBe(true);
    expect(arrayTest()).toBe(true);
    expect(objectTest()).toBe(true);
    expect(ownObjectWatchTest()).toBe(true);
    expect(ownArrayWatchTest()).toBe(true);
});

function createExpress(express: string): Function {
    try {
        return new Function(EXPRESSHANDLERTAG, "return " + express + ";");
    } catch (e) {
        throw new Error("表达式创建失败，表达式内容：" + express);
    }
}
