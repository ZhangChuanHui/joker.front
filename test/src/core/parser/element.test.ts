import { Parser } from "@joker/template-compiler";
import { Component } from "@joker/core/src/component";
import { TemplateParser } from "@joker/core/src/parser/index";
import { ElementNodeInfo } from "@joker/core";

class TestView extends Component {
    model = {
        attr1: "v1",
        attr2: "v2",
        class1: "v3"
    };
    event1() {}
    event2() {}
}

function mainTest() {
    let result = new Parser(`
    <div class="className @model.class1" @click="event1" attr="@model.attr1" attr1="@(model.attr2+1)" @tap="event2(2)"></div>`);
    let ast = result.elements;

    let templates = new TemplateParser(ast, new TestView());

    if (templates.nodes.length === 0) return false;

    let node = templates.nodes[0] as ElementNodeInfo;

    if (
        (node.attrs &&
            node.attrs.class === "className v3" &&
            node.attrs.attr === "v1" &&
            node.attrs.attr1 === "v21" &&
            node.events &&
            node.events.length === 2) === false
    ) {
        throw new Error("Element 渲染错误");
    }

    return true;
}

function changeTest() {
    let result = new Parser(`
    <div class="className @model.class1" attr="@model.attr1" attr2="@model.attr1"></div>`);
    let ast = result.elements;

    let view = new TestView().ComponentInitialize();

    let templates = new TemplateParser(ast, view);

    if (templates.nodes.length === 0) return false;

    let node = templates.nodes[0] as ElementNodeInfo;

    if (node.attrs && node.attrs.class === "className v3" && node.attrs.attr === "v1") {
        view.model.class1 = "new3";
        view.model.attr1 = "new1";

        return <any>node.attrs.class === "className new3" && <any>node.attrs.attr === "new1";
    }

    return false;
}

test("next/parser/element", () => {
    expect(mainTest()).toBe(true);
    expect(changeTest()).toBe(true);
});
