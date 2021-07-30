import { Parser } from "@joker/template-compiler";
import { INJECT_RENDER, Component, ComponentNodeInfo } from "@joker/core";
import { RenderHtml } from "@joker/render-html";
import { IContainer } from "@joker/shared";

IContainer.bind(INJECT_RENDER).to(RenderHtml);

let mainTemplate = `<div attr="@mixins.cc.model.state"></div>`;

class ChildrenComponent extends Component {
    model = {
        state: "1"
    };
}

let cc = new ChildrenComponent();

class MainView extends Component {
    template = new Parser(mainTemplate).elements;
    mixins = {
        cc: new ChildrenComponent()
    };
}

class Main2View extends Component {
    template = new Parser(mainTemplate).elements;
    mixins = {
        cc
    };
}

class Main3View extends Component {
    template = new Parser(mainTemplate).elements;
    mixins = {
        cc
    };
}

function mainTest() {
    //标准mixins模式
    let view = new MainView();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    return container.innerHTML === `<div attr="1"></div>`;
}

function main2Test() {
    //状态管理形态
    let view2 = new Main2View();

    let container2 = document.createElement("div");

    view2.ComponentInitialize(container2);

    let view3 = new Main3View();

    let container3 = document.createElement("div");

    view3.ComponentInitialize(container3);

    if ((container2.innerHTML === container3.innerHTML && container2.innerHTML === `<div attr="1"></div>`) === false)
        throw new Error("状态管理器未正常运行");

    cc.model.state = "2";

    if ((container2.innerHTML === container3.innerHTML && container2.innerHTML === `<div attr="2"></div>`) === false)
        throw new Error("状态管理器数据变更未通知生效");

    return true;
}

test("component/section", () => {
    expect(mainTest()).toBe(true);
    expect(main2Test()).toBe(true);
});
