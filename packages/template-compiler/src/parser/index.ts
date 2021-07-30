import { HTMLParser, TAG_PLAINTEXT_ELEMENT } from "./parser-xml";
import { AST, ASTNODETYPE, createCommand, createComment, createElement, createText } from "@joker/ast";
import { stringUtils } from "@joker/shared";
import { COMMANDGROUPKEYS, createCodeFunction } from "@joker/ast";

//需要忽略换行符的标签
const RE_NEWLINE_WHITESPACE = /^[\s\r\n]+$/;

export class Parser {
    public elements: Array<AST> = [];

    //节点层级链路，用于贯穿节点层级
    private nodeLinks: Array<AST> = [];

    private prevNode?: AST;

    constructor(private html: string, option?: ParserOption) {
        option = option || {
            keepComment: true,
            onWarn: (errorMsg: string, info: { [key: string]: any }) => {
                console.warn(errorMsg, info);
            }
        };

        new HTMLParser(html, {
            onTagStart: this.onTagStart.bind(this),
            onTagEnd: this.onTagEnd.bind(this),
            onCustomStart: this.onCustomStart.bind(this),
            onCustomEnd: this.onTagEnd.bind(this),
            onChars: this.onChars.bind(this),
            onComment: this.onComment.bind(this),
            keepComment: !!option.keepComment,
            onWarn: option.onWarn
        });
    }

    private onTagStart(tagName: string, attrs: Array<any>, isUnary: boolean) {
        let astAttrs: { [key: string]: string } = {};

        attrs.forEach((item) => {
            astAttrs[item.name] = item.value;
        });
        let item: AST = createElement(tagName, astAttrs);

        this.pushItem(item);

        this.prevNode = item;

        if (!isUnary) {
            this.nodeLinks.push(item);
        }
    }

    private onTagEnd() {
        let last = this.nodeLinks.pop();

        if (last && last.childrens && last.childrens.length) {
            let lastItem = last.childrens[last.childrens.length - 1];

            if (lastItem.type === ASTNODETYPE.TEXT && TAG_PLAINTEXT_ELEMENT.includes(last.tagName || "") === false) {
                lastItem.data = stringUtils.trimEnd(lastItem.data);

                //剔除结尾空数据
                if (stringUtils.isEmpty(lastItem.data)) {
                    last.childrens.pop();
                }
            }
        }

        this.prevNode = undefined;
    }

    private onCustomStart(val: string, key: string, param: string, isGroup: boolean) {
        let astItem: AST;
        if (stringUtils.isEmpty(key)) {
            astItem = createCodeFunction(param);
        } else if (param === undefined && COMMANDGROUPKEYS.indexOf(key) === -1) {
            astItem = createCodeFunction(key);
        } else {
            astItem = createCommand(key, param);
        }

        this.pushItem(astItem);

        this.prevNode = astItem;

        if (isGroup) {
            this.nodeLinks.push(astItem);
        }
    }

    private onChars(text: string) {
        let item: AST = createText(text);
        let last = this.nodeLinks[this.nodeLinks.length - 1];

        //如果是空格换行符，并且没有父级 则忽略
        if (RE_NEWLINE_WHITESPACE.test(text) && last === undefined) return;

        //如果需要换行符的标签，则不处理任何空格
        if ((last && TAG_PLAINTEXT_ELEMENT.includes(last.tagName?.toLowerCase() || "")) === false) {
            if (RE_NEWLINE_WHITESPACE.test(text)) {
                //整个文档开头不能直接是换行符
                if (this.prevNode === undefined) return;

                if (this.prevNode.type !== ASTNODETYPE.TEXT) {
                    return;
                }
            }

            //如果第一个子集是字符串，则剔除前面的所有空格及换行符
            if (last && (last.childrens === undefined || last.childrens.length === 0)) {
                item.data = stringUtils.trimStart(item.data);
            }
        }

        this.prevNode = item;

        this.pushItem(item);
    }

    private onComment(text: string) {
        let item = createComment(text);

        this.prevNode = item;

        this.pushItem(item);
    }

    private pushItem(item: AST) {
        if (this.nodeLinks.length) {
            let last = this.nodeLinks[this.nodeLinks.length - 1];

            last.childrens = last.childrens || [];

            last.childrens.push(item);
        } else {
            this.elements.push(item);
        }
    }
}

export type ParserOption = {
    keepComment?: Boolean;
    onWarn?: (errmsg: string, info: { [key: string]: any }) => void;
};
