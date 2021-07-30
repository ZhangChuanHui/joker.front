import { Parser } from "@joker/template-compiler";
import { Component } from "@joker/core/src/component";
import { TemplateParser } from "@joker/core/src/parser/index";

class TestView extends Component {
    model = {
        attr1: "v1",
        attr2: "v2",
        list: ["a", "b", "c", "d"]
    };
}

function conditionTest() {
    let result = new Parser(`
        @if(model.attr1=='v1'){
            <p>内容1</p>
        }
        else if(2==2){
            <p>内容2</p>
        }
        else{
            <p>内容2</p>
        }
    `);

    let templates = new TemplateParser(result.elements, new TestView());

    let resultElseIf = new Parser(`
        @if(model.attr1=='v2'){
            <p>内容1</p>
        }
        else if(2==2){
            <p>内容2</p>
        }
        else{
            <p>内容2</p>
        }
    `);

    let templatesElseIf = new TemplateParser(resultElseIf.elements, new TestView());

    let resultElse = new Parser(`
        @if(model.attr1=='v2'){
            <p>内容1</p>
        }
        else if(2==1){
            <p>内容2</p>
        }
        else{
            <p>内容2</p>
        }
    `);

    let templatesElse = new TemplateParser(resultElse.elements, new TestView());

    return (
        templates.nodes.length === 3 &&
        templates.nodes[0].childrens !== undefined &&
        templates.nodes[1].childrens === undefined &&
        templates.nodes[2].childrens === undefined &&
        templatesElseIf.nodes.length === 3 &&
        templatesElseIf.nodes[0].childrens === undefined &&
        templatesElseIf.nodes[1].childrens !== undefined &&
        templatesElseIf.nodes[2].childrens === undefined &&
        templatesElse.nodes.length === 3 &&
        templatesElse.nodes[0].childrens === undefined &&
        templatesElse.nodes[1].childrens === undefined &&
        templatesElse.nodes[2].childrens !== undefined
    );
}

function conditionChangeTest() {
    let result = new Parser(`
        @if(model.attr1=='v1'){
            <p>内容1</p>
        }
        else if(model.attr1=='v2'){
            <p>内容2</p>
        }
        else{
            <p>内容2</p>
        }
    `);
    let view = new TestView().ComponentInitialize();

    let templates = new TemplateParser(result.elements, view);

    let nodes = templates.nodes;

    if (
        (nodes.length === 3 &&
            nodes[0].childrens !== undefined &&
            nodes[1].childrens === undefined &&
            nodes[2].childrens === undefined) === false
    )
        return false;

    view.model.attr1 = "v2";

    if (
        (nodes.length === 3 &&
            !nodes[0].childrens?.length &&
            nodes[1].childrens?.length === 1 &&
            //else 必须是undefined  不能让他初始化，内存优化
            nodes[2].childrens === undefined) === false
    ) {
        return false;
    }

    view.model.attr1 = "v3";

    return (
        nodes.length === 3 &&
        !nodes[0].childrens?.length &&
        !nodes[1].childrens?.length &&
        //else 必须是undefined  不能让他初始化，内存优化
        nodes[2].childrens?.length === 1
    );
}

test("next/parser/command - 条件逻辑", () => {
    expect(conditionTest()).toBe(true);
    expect(conditionChangeTest()).toBe(true);
});
