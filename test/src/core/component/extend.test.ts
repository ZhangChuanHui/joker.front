import { Parser } from "@joker/template-compiler";
import { INJECT_RENDER, Component, ComponentNodeInfo } from "@joker/core";
import { RenderHtml } from "@joker/render-html";
import { IContainer } from "@joker/shared";

IContainer.bind(INJECT_RENDER).to(RenderHtml);

let mainTemplate = new Parser(`
    <div>
        @if(model.show){
            <ChildrenComponent ref="id" param1="1" param2="@model.v1"></ChildrenComponent>
        }
    </div>
`);

let childrenTemplate = new Parser(`
    <p></p>
`);

let isMounted = false;
let isDispose = false;

class ChildrenComponent extends Component {
    template = childrenTemplate.elements;

    propTypes = {
        param1: String,
        param2: {
            type: String
        }
    };

    mounted() {
        isMounted = true;
    }
    dispose() {
        isDispose = true;
    }
}

class MainView extends Component {
    template = mainTemplate.elements;

    model = {
        show: true,
        v1: "我是父组件data.v1"
    };
    components = {
        ChildrenComponent
    };
}

function childrenComponentTest() {
    let view = new MainView();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    if (isMounted === false) throw new Error("子组件生命周期未正常运行");

    if (view.refs.id?.length === 0) throw new Error("子组件ref标记失败");

    let childrenProps = (<ComponentNodeInfo>view.refs.id[0]).component.props;

    if (childrenProps.param1 === "1" && childrenProps.param2 !== "我是父组件data.v1")
        throw new Error("props值接受失败");

    view.model.v1 = "v2";

    if (childrenProps.param2 !== "v2") throw new Error("props值同步错误");

    let isReadonlySuccess = false;
    try {
        childrenProps.param2 = "v3";
    } catch {
        isReadonlySuccess = true;
    }

    if (isReadonlySuccess === false) throw new Error("prop 只读未限制");

    view.model.show = false;

    if (isDispose === false) throw new Error("子组件未正常卸载");

    return true;
}

test("component/extend", () => {
    expect(childrenComponentTest()).toBe(true);
});
