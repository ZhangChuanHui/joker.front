import { arrayUtils } from "@joker/shared";
import { Parser } from "@joker/template-compiler";
import { Component } from "@joker/core/src/component";
import { TemplateParser } from "@joker/core/src/parser/index";
import { ElementNodeInfo } from "../../../../packages/core/src";

class TestView extends Component {
    model = {
        attr1: "v1",
        attr2: "v2",
        list: ["a", "b", "c", "d"]
    };
}

//#region  条件列表测试
function conditiontTest() {
    let result = new Parser(`
        @for(let i=0;i<model.list.length;i++){
            <p attr1="@i" attr2 ="@model.list[i]"></p>
        }
    `);

    return parserTest(result);
}

function conditiontChangeTest() {
    let result = new Parser(`
        @for(let i=0;i<model.list.length;i++){
            <p attr1="@i" attr2 ="@model.list[i]"></p>
        }
    `);

    return changeTest(result);
}
//#endregion

//#region  条件列表测试
function inTest() {
    let result = new Parser(`
        @for(let i in model.list){
            <p attr1="@i" attr2 ="@model.list[i]"></p>
        }
    `);

    return parserTest(result);
}

function inChangeTest() {
    let result = new Parser(`
        @for(let i in model.list){
            <p attr1="@i" attr2 ="@model.list[i]"></p>
        }
    `);

    return changeTest(result);
}
//#endregion

function parserTest(parser: Parser): boolean {
    let view = new TestView().ComponentInitialize();

    let templates = new TemplateParser(parser.elements, view);

    let nodes = templates.nodes;

    return (
        nodes.length === 1 &&
        nodes[0].childrens?.length === 4 &&
        (<ElementNodeInfo>nodes[0].childrens[0].childrens[0]).attrs.attr1 === "0" &&
        (<ElementNodeInfo>nodes[0].childrens[0].childrens[0]).attrs.attr2 === "a" &&
        (<ElementNodeInfo>nodes[0].childrens[1].childrens[0]).attrs.attr1 === "1" &&
        (<ElementNodeInfo>nodes[0].childrens[1].childrens[0]).attrs.attr2 === "b" &&
        (<ElementNodeInfo>nodes[0].childrens[2].childrens[0]).attrs.attr1 === "2" &&
        (<ElementNodeInfo>nodes[0].childrens[2].childrens[0]).attrs.attr2 === "c" &&
        (<ElementNodeInfo>nodes[0].childrens[3].childrens[0]).attrs.attr1 === "3" &&
        (<ElementNodeInfo>nodes[0].childrens[3].childrens[0]).attrs.attr2 === "d"
    );
}
function changeTest(parser: Parser): boolean {
    let view = new TestView();
    view.ComponentInitialize();

    let templates = new TemplateParser(parser.elements, view);

    let nodes = templates.nodes;

    //#region 【改】
    view.model.list[0] = "e";

    if ((<ElementNodeInfo>nodes[0].childrens[0].childrens[0]).attrs.attr2 !== "e") return false;
    //#endregion

    //#region 【增】
    view.model.list.push("a");
    if (
        (nodes[0].childrens?.length === 5 &&
            (<ElementNodeInfo>nodes[0].childrens[4].childrens[0]).attrs.attr1 === "4" &&
            (<ElementNodeInfo>nodes[0].childrens[4].childrens[0]).attrs.attr2 === "a") === false
    )
        return false;
    //#endregion

    //#region 【删】
    arrayUtils.without(view.model.list, "a");
    if (nodes[0].childrens?.length !== 4) return false;
    //#endregion

    return true;
}

test("next/parser/command - 循环列表", () => {
    //条件式列表循环
    expect(conditiontTest()).toBe(true);
    expect(conditiontChangeTest()).toBe(true);

    //for in 列表循环
    expect(inTest()).toBe(true);
    expect(inChangeTest()).toBe(true);
});
