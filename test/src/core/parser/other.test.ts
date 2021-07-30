import { Parser } from "@joker/template-compiler";
import { Component } from "@joker/core/src/component";
import { TemplateParser } from "@joker/core/src/parser/index";
import { NodeType } from "@joker/core/src/parser/parser";

class TestView extends Component {
    model = {};
}

function otherTest() {
    let view = new TestView();
    view.ComponentInitialize();

    let result = new Parser(`
        <!--我是注释内容-->
        我是一个文本
    `);

    let templates = new TemplateParser(result.elements, view);

    let nodes = templates.nodes;

    return nodes.length === 2 && nodes[0].nodeType === NodeType.COMMENT && nodes[1].nodeType === NodeType.TEXT;
}

test("next/parser/other - 文本/注释", () => {
    expect(otherTest()).toBe(true);
});
