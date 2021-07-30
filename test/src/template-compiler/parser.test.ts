import { Parser } from "@joker/template-compiler/src/parser/index";
import { ASTNODETYPE } from "../../../packages/ast/src";

function parserTest() {
    let result = new Parser(`
    <div class="a" @click="sss" attr="@a" attr1="@(sss+1)" @tap="x (e,2)">
        @section("id1",a,v){
            <p></p>
        }
        @section {
            <p></p>
        }
        @ss
        @xx(1)
        @if (true)  {
            <p>
                我是一句话
                hhhh
            </p>
            <p>
                @ss
                @xx(1)
                @(1+1)

            </p>
            <ul>
                @for(let item in datas){
                    <li>@item</li>
                }

                @for(let item of datas)
                {
                    <li>@(item.text+";")</li>
                }

                @for(let (key,item) in datas){
                    <li>@(item.text+";")</li>
                }

                @for(let i=0;i<datas.length;i++){
                    <li>@(datas[i].text+";")</li>
                }
            </ul>
        }
        
        else if(1==2)
        {
            @ss
            <p>@ss</p>
        }
        else{
            
        }
    </div>`);
    return result.elements.length && result.elements[0].childrens.length === 7;
}

function parserArrayIndex() {
    let result = new Parser(`
        @model.list
        @model.list[i]
        @(model.list[i])
        @model.list[i][a]
        @model.list[1]["2"]
        <p attr="@model.list[0][a]">
            @RenderSection()
        </p>

    `);

    return (
        result.elements[0].data === "context.model.list" &&
        result.elements[1].data === "context.model.list[context.i]" &&
        result.elements[2].data === "context.model.list[context.i]" &&
        result.elements[3].data === "context.model.list[context.i][context.a]" &&
        result.elements[4].data === 'context.model.list[1]["2"]' &&
        result.elements[5].attrs[0].expressValue === "context.model.list[0][context.a]" &&
        result.elements[5].childrens?.length === 1
    );
}

function commentTest() {
    let result = new Parser(`
        <!--我是注释内容-->
        我是一个文本
    `);

    return result.elements.length === 2;
}

function newLineTest() {
    let result = new Parser(`
        <div>
            @RenderSection()
            @RenderSection('')
            @model.list
            @model.list[i]
            <textarea>
                1
                @model.list
                2
            </textarea>
        </div>
    `);

    return (
        result.elements[0].childrens.length === 5 &&
        result.elements[0].childrens[4].childrens.length === 1 &&
        result.elements[0].childrens[4].childrens[0].type === ASTNODETYPE.COMMAND
    );
}

test("HTML解析-虚拟DOM", () => {
    expect(parserTest()).toBe(true);
    expect(parserArrayIndex()).toBe(true);
    expect(commentTest()).toBe(true);
    expect(newLineTest()).toBe(true);
});
