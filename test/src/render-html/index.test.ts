import { Parser } from "@joker/template-compiler";
import { Component } from "@joker/core/src/component";
import { TemplateParser } from "@joker/core/src/parser/index";
import { arrayUtils, IContainer } from "@joker/shared";
import { INJECT_RENDER, NodeEvent } from "@joker/core";
import { RenderHtml } from "@joker/render-html";

let eventTestValue = false;

class TestView extends Component {
    model = {
        class1: "className1",
        attr1: "v1",
        attr2: "v2",
        list: ["a", "b", "c", "d"],
        index: 1
    };
    test(a: number) {
        return this.model.index + a;
    }
    elClick(event: NodeEvent, p1: string, p2: Array<any>) {
        if (event && p1 === "v1" && p2.length > 0) {
            eventTestValue = true;
        }
    }
}

IContainer.bind(INJECT_RENDER).to(RenderHtml);

function conditionTest() {
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

    let templates = new TemplateParser(result.elements, view, true);

    let container = document.createElement("div");

    templates.Render.mount(container);

    if (container.innerHTML !== `<p>内容1</p>`) return false;

    view.model.attr1 = "v2";

    if (<string>container.innerHTML !== `<p>内容2</p>`) {
        return false;
    }

    view.model.attr1 = "v3";

    return <string>container.innerHTML === `<p>内容2</p>`;
}

function elementTest() {
    let result = new Parser(`
    <div class="className @model.class1" @click.prevent.stop.self.once="elClick" attr="@model.attr1" attr2="@model.attr1"></div>`);
    let ast = result.elements;

    let view = new TestView().ComponentInitialize();

    let templates = new TemplateParser(ast, view, true);

    let container = document.createElement("div");

    templates.Render.mount(container);

    if (container.innerHTML !== `<div class="className className1" attr="v1" attr2="v1"></div>`) return false;

    view.model.class1 = "new3";
    if (<string>container.innerHTML !== `<div class="className new3" attr="v1" attr2="v1"></div>`) return false;

    view.model.attr1 = "new1";

    if (<string>container.innerHTML !== `<div class="className new3" attr="new1" attr2="new1"></div>`) return false;
    return true;
}

function listTest() {
    let view = new TestView();
    view.ComponentInitialize();

    let parser = new Parser(`
        @for(let i=0;i<model.list.length;i++){
            <p attr1="@i" attr2 ="@model.list[i]"></p>
        }
    `);

    let templates = new TemplateParser(parser.elements, view, true);

    let container = document.createElement("div");

    templates.Render.mount(container);

    if (
        container.innerHTML !==
        `<p attr1="0" attr2="a"></p><p attr1="1" attr2="b"></p><p attr1="2" attr2="c"></p><p attr1="3" attr2="d"></p>`
    )
        return false;
    //#region 【改】
    view.model.list[0] = "e";

    if (
        <string>container.innerHTML !==
        `<p attr1="0" attr2="e"></p><p attr1="1" attr2="b"></p><p attr1="2" attr2="c"></p><p attr1="3" attr2="d"></p>`
    )
        return false;
    //#endregion

    //#region 【增】
    view.model.list.push("a");
    if (
        <string>container.innerHTML !==
        `<p attr1="0" attr2="e"></p><p attr1="1" attr2="b"></p><p attr1="2" attr2="c"></p><p attr1="3" attr2="d"></p><p attr1="4" attr2="a"></p>`
    )
        return false;
    //#endregion

    //#region 【删】
    arrayUtils.without(view.model.list, "a");
    if (
        <string>container.innerHTML !==
        `<p attr1="0" attr2="e"></p><p attr1="1" attr2="b"></p><p attr1="2" attr2="c"></p><p attr1="3" attr2="d"></p>`
    )
        return false;
    //#endregion

    return true;
}

function codeFunctionTest() {
    let view = new TestView();
    view.ComponentInitialize();

    let result = new Parser(`
        @test(1)
    `);

    let templates = new TemplateParser(result.elements, view, true);

    let container = document.createElement("div");

    templates.Render.mount(container);

    if (container.innerHTML !== "2") return false;

    view.model.index = 2;

    return <string>container.innerHTML === "3";
}

function eventTest() {
    let result = new Parser(`
    <div  @click.prevent.stop.self.once="elClick(model.attr1,model.list)"></div>`);
    let ast = result.elements;

    let view = new TestView().ComponentInitialize();

    let templates = new TemplateParser(ast, view, true);

    let container = document.createElement("div");

    templates.Render.mount(container);

    trigger(container.children[0], "click");

    if (eventTestValue === false) throw new Error("事件未执行");

    eventTestValue = false;
    trigger(container.children[0], "click");

    if (eventTestValue) throw new Error("事件once未生效");
    return true;
}

function trigger(el: Element, eventName: string) {
    let event = document.createEvent("HTMLEvents");
    event.initEvent(eventName, false, false);

    el.dispatchEvent(event);
}

test("render-html - HTML渲染类库", () => {
    expect(conditionTest()).toBe(true);
    expect(elementTest()).toBe(true);
    expect(listTest()).toBe(true);
    expect(codeFunctionTest()).toBe(true);

    expect(eventTest()).toBe(true);
});
