import { Parser } from "@joker/template-compiler";
import { INJECT_RENDER, Component, ComponentNodeInfo, NodeEvent } from "@joker/core";
import { RenderHtml } from "@joker/render-html";
import { IContainer } from "@joker/shared";

IContainer.bind(INJECT_RENDER).to(RenderHtml);

let mainTemplate = new Parser(`
    <div>
        <ChildrenComponent ref="cc" @CEvent="callBack(model.v1)"></ChildrenComponent>
    </div>
`);

let childrenTemplate = new Parser(`
    <p></p>
`);

class ChildrenComponent extends Component {
    template = childrenTemplate.elements;
    test() {
        this.trigger("CEvent", "1");
    }
}
let callBackParam: Array<any> = [];
class MainView extends Component {
    template = mainTemplate.elements;

    model = {
        show: true,
        v1: "我是父组件data.v1"
    };
    callBack(e: NodeEvent, p1: string) {
        callBackParam.push(p1);
        callBackParam.push(e.data);
    }
    components = {
        ChildrenComponent
    };
}

function childrenComponentTest() {
    let view = new MainView();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    let cc = <ChildrenComponent>(<ComponentNodeInfo>view.refs.cc[0]).component;

    cc.test();

    return callBackParam.length === 2 && callBackParam[0] === "我是父组件data.v1" && callBackParam[1] === "1";
}

test("component/event", () => {
    expect(childrenComponentTest()).toBe(true);
});
