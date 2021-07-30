import { Parser } from "@joker/template-compiler";
import { Component } from "@joker/core/src/component";
import { TemplateParser } from "@joker/core/src/parser/index";
import { HtmlNodeInfo, NodeType, TextNodeInfo } from "@joker/core";

class TestView extends Component {
    model = {
        attr1: "v1",
        attr2: "v2",
        index: 1,
        list: ["a", "b", "c", "d"]
    };
    test(a: number, b: number) {
        return a + b;
    }
    test2(a: number) {
        return a + this.model.index;
    }
}

function codeFunctionTest() {
    let view = new TestView();
    view.ComponentInitialize();
    let result = new Parser(`
        @model.attr1
        @test(1,2)
        @Html('<p>s</p>')
    `);

    let templates = new TemplateParser(result.elements, view);

    let nodes = templates.nodes;

    return (
        nodes.length === 3 &&
        nodes[0].nodeType === NodeType.TEXT &&
        (<TextNodeInfo>nodes[0]).text === "v1" &&
        nodes[1].nodeType === NodeType.TEXT &&
        (<TextNodeInfo>nodes[1]).text === "3" &&
        nodes[2].nodeType === NodeType.HTML &&
        (<HtmlNodeInfo>nodes[2]).html === "<p>s</p>"
    );
}

function codeFunctionChangeTest() {
    let view = new TestView();
    view.ComponentInitialize();

    let result = new Parser(`
        @test2(1)
    `);

    let templates = new TemplateParser(result.elements, view);

    let nodes = templates.nodes;

    if ((<TextNodeInfo>nodes[0]).text !== "2") throw new Error("模型值和参数运算出错");

    view.model.index = 2;

    if ((<TextNodeInfo>nodes[0]).text !== "3") throw new Error("模型值更新后，node值未更新");

    return true;
}

test("next/parser/command - 方法/命令", () => {
    expect(codeFunctionTest()).toBe(true);
    expect(codeFunctionChangeTest()).toBe(true);
});
