import { HTMLParser } from "@joker/template-compiler/src/parser/parser-xml";

function htmlTest() {
    let tagStartCheck = false;
    let tagEndCheck = false;
    let charCheck = false;
    new HTMLParser("<div id='demo' :click='clickFunction'>@if(true){content}</div>", {
        onTagStart: (val, attrs) => {
            tagStartCheck = val === "div" && attrs.length == 2;
        },
        onTagEnd: (val) => {
            tagEndCheck = val === "div";
        },
        onChars: (val) => {
            charCheck = val === "content";
        }
    });
    return tagStartCheck && tagEndCheck && charCheck;
}

function stringParserToHtml() {
    let pHtml = `<!--我是注释-->
    <div id ="demo" :click ="clickFunction">
        content<br/>
        <p>啦啦啦啦</p>
        ><>《
        <input type ="text"/>
        @if(aaa){
            <p>呀呀呀呀</p>
        }
        else if(bbb){
            <p>1111</p>
        }
        else{
            <p>2222</p>
        }
        @for(let item of arr){
            <ul>
                <li>item</li>
            </ul>
        }
    </div>`;
    let html = "";
    new HTMLParser(pHtml, {
        keepComment: true,
        onTagStart: (val, attrs, u) => {
            html += "<" + val;

            for (var i = 0; i < attrs.length; i++) {
                html += ` ${attrs[i].name} ="${attrs[i].value}"`;
            }
            if (u) html += "/";
            html += ">";
        },
        onTagEnd: (val) => {
            html += `</${val}>`;
        },
        onChars: (val) => {
            html += val;
        },
        onComment: (val) => {
            html += `<!--${val}-->`;
        },
        onCustomStart: (val, key, params) => {
            html += key === "if" || key === "for" ? `@${val}{` : `${val}`;
        },
        onCustomEnd: (val, key, params) => {
            html += `        }`;
        }
    });

    return html === pHtml;
}

function specialKeyWordParser() {
    let result = [],
        spanEndCount = 0;

    new HTMLParser(
        `@SS(1+2)123)
        @ss
        @if(true) { 
           <span>@(ss)11</span>
           sss{   }
        }s
        </span>
        @for(let item of arr){
            <p>@item</p>
            xxx
        }`,
        {
            onCustomStart(
                val: string,
                key: string,
                param: string,
                isGroup: boolean,
                startIndex: number,
                endIndex: number
            ) {
                result.push({
                    type: "custom",
                    key: key,
                    param: param,
                    isGroup: isGroup
                });
            },
            onChars(val) {
                result.push({ type: "char", key: val });
            },
            onTagStart(val: string) {
                result.push({ type: "tagStart", key: val });
            },
            onTagEnd(val: string) {
                result.push({ type: "tagEnd", key: val });
                val === "span" && spanEndCount++;
            },
            onCustomEnd(
                val: string,
                key: string,
                param: string,
                isGroup: boolean,
                startIndex: number,
                endIndex: number
            ) {
                result.push({ type: "custom-end", key: key, param: param });
            }
        }
    );

    return result.length === 24 && spanEndCount === 1;
}

test( "HTML解析-模板渲染解析", () => {
    expect(stringParserToHtml()).toBe(true);
    expect(htmlTest()).toBe(true);
    expect(specialKeyWordParser()).toBe(true);
});
