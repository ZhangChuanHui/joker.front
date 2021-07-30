import { Parser } from "@joker/template-compiler";
import { INJECT_RENDER, Component, registerComponent } from "@joker/core";
import { RenderHtml } from "@joker/render-html";
import { IContainer } from "@joker/shared";

IContainer.bind(INJECT_RENDER).to(RenderHtml);

let mainTemplate = new Parser(`
    <div>
        @for(let i=0;i<5;i++){
            <ChildrenComponent param1="1" param2="@v1"></ChildrenComponent>
        }
    </div>
`);

let childrenTemplate = new Parser(`
    <p>123</p>
`);

class ChildrenComponent extends Component {
    template = childrenTemplate.elements;
}

class MainView extends Component {
    template = mainTemplate.elements;

    components = {
        ChildrenComponent
    };
}

class GlobalTestView extends Component {
    template = mainTemplate.elements;
}

function childrenComponentTest() {
    let view = new MainView();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    return container.innerHTML === "<div><p>123</p><p>123</p><p>123</p><p>123</p><p>123</p></div>";
}

function globalComponentTest() {
    registerComponent({
        ChildrenComponent
    });

    let view = new GlobalTestView();

    let container = document.createElement("div");

    view.ComponentInitialize(container);

    return container.innerHTML === "<div><p>123</p><p>123</p><p>123</p><p>123</p><p>123</p></div>";
}

test("component/register", () => {
    expect(childrenComponentTest()).toBe(true);
    expect(globalComponentTest()).toBe(true);
});
