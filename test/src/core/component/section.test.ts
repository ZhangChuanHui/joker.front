import { Parser } from "@joker/template-compiler";
import { INJECT_RENDER, Component, ComponentNodeInfo } from "@joker/core";
import { RenderHtml } from "@joker/render-html";
import { IContainer } from "@joker/shared";

IContainer.bind(INJECT_RENDER).to(RenderHtml);

let mainTemplate = new Parser(`
    <div>
        @if(model.show){
            <ChildrenComponent>
               <span attr="@model.mv1">我是插槽内容</span>
               <span>我是第二行</span>
            </ChildrenComponent>
        }
    </div>
`);

let mainTemplate2 = new Parser(`
    <div>
        <ChildrenComponent ref="cc">
            <span>我是插槽内容</span>
            @section ("id1",a,b){
              <span attr1="@a" att2="@b"></span>
            }
        </ChildrenComponent>
    </div>
`);

let childrenTemplate = `
    <p>
        @RenderSection()
        @RenderSection('id1',model.cv1,model.cv2)
    </p>
`;

class ChildrenComponent extends Component {
    template = new Parser(childrenTemplate).elements;
    model = {
        cv1: "cv1",
        cv2: "cv2"
    };
}

class MainView extends Component {
    template = mainTemplate.elements;

    model = {
        show: true,
        mv1: "v1"
    };
    components = {
        ChildrenComponent
    };
}

class Main2View extends Component {
    template = mainTemplate2.elements;

    components = {
        ChildrenComponent
    };
}

function mainTest() {
    let view = new MainView();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    if (container.innerHTML !== `<div><p><span attr="v1">我是插槽内容</span><span>我是第二行</span></p></div>`)
        throw new Error("插槽内容未展示");

    view.model.show = false;

    return <string>container.innerHTML === "<div></div>";
}

function main2Test() {
    let view = new Main2View();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    if (container.innerHTML !== `<div><p><span>我是插槽内容</span><span attr1="cv1" att2="cv2"></span></p></div>`)
        throw new Error("插槽内容未展示");

    (<ComponentNodeInfo>view.refs.cc[0]).component.model.cv1 = "cv3";

    if (
        <string>container.innerHTML !==
        `<div><p><span>我是插槽内容</span><span attr1="cv3" att2="cv2"></span></p></div>`
    )
        throw new Error("数据同步错误");
    return true;
}

test("component/section", () => {
    expect(mainTest()).toBe(true);
    expect(main2Test()).toBe(true);
});
