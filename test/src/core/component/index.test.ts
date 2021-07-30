import { Component, NodeChangeType } from "@joker/core/src/component";
import { Parser } from "@joker/template-compiler";
import { INJECT_RENDER, NodeInfo } from "@joker/core";
import { RenderHtml } from "@joker/render-html";
import { IContainer } from "@joker/shared";

IContainer.bind(INJECT_RENDER).to(RenderHtml);

let result = new Parser(`
    @if(model.attr1=='v1'){
        <p ref="r1">内容1</p>
    }
    else if(model.attr1=='v2'){
        <p ref="r2">内容2</p>
    }
    else{
        <p>内容2</p>
    }
`);

let isRunBeforeRender = false,
    isRunRender = false,
    isRunMount = false,
    isRunDispose = false,
    watcherTest: Array<any> = [],
    watcherNode: { [key: string]: NodeChangeType } = {};

class TestView extends Component {
    model = {
        attr1: "v1",
        watchTest: "1"
    };
    template = result.elements;

    render() {
        isRunRender = true;
    }

    beforeRender() {
        isRunBeforeRender = true;
    }

    mounted(root: any) {
        isRunMount = true;

        this.watchNode("r1", (node: NodeInfo, type: NodeChangeType) => {
            watcherNode["v1"] = type;
        });

        this.watchNode("r2", (node: NodeInfo, type: NodeChangeType) => {
            watcherNode["v2"] = type;
        });

        this.watchValue(
            () => this.model.watchTest,
            (v1: string, v2: string) => {
                watcherTest.push(v1);
                watcherTest.push(v2);
            }
        );
    }

    dispose() {
        isRunDispose = true;
    }
}

function mainTest() {
    let view = new TestView();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    if (isRunRender === false || isRunBeforeRender === false) {
        throw new Error("main/initializeComponent初始化生命周期未执行");
    }

    if (isRunMount === false || container.innerHTML !== "<p>内容1</p>") {
        throw new Error("mount 挂载异常");
    }

    view.model.watchTest = "2";

    //watcher 必须在 挂载后才可以适用，挂载时才会做数据劫持
    if ((watcherTest.length === 2 && watcherTest[0] === "2" && watcherTest[1] === "1") === false)
        throw new Error("数据监听异常");

    view.model.attr1 = "v2";

    if ((watcherNode.v1 === NodeChangeType.REMOVE && watcherNode.v2 === NodeChangeType.APPEND) === false)
        throw new Error("node 状态监听失败");

    view.ComponentDispose();

    if (isRunDispose === false) {
        throw new Error("dispose 周期执行失败");
    }

    return true;
}

test("component/index", () => {
    expect(mainTest()).toBe(true);
});
