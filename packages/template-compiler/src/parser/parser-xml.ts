import { COMMANDGROUPKEYS } from "@joker/ast";
import { matchUtils } from "@joker/shared";

//#region  正则列表

/** attribut属性正则 */
const RE_ATTRIBUTE = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
/**自定义element 名字
 * https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
 */
const RE_POTENTIALCUSTOMELEMENTNAME =
    /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
/**TAGName 拼凑值 */
const _STR_RE_TAGNAME = `[a-zA-Z_][-_.0-9a-zA-Z${RE_POTENTIALCUSTOMELEMENTNAME.source}]*`;
/**tagName */
const STR_RE_TAGNAME = `((?:${_STR_RE_TAGNAME}\\:)?${_STR_RE_TAGNAME})`;
/**开始标签Open */
const RE_STARTTAGOPEN = new RegExp(`<((?:${STR_RE_TAGNAME}))`);
/**开始标签Close */
const RE_STARTTAGCLOSE = /^\s*(\/?)>/;
/**结束标签 */
const RE_ENDTAG = new RegExp(`^<\\/${STR_RE_TAGNAME}[^>]*>`);
/**DOCTYPE */
const RE_DOCTYPE = /^<!DOCTYPE [^>]+/i;
//html中注释
const RE_COMMENT = /^<!\--/;
//html中判断注释
const RE_CONDITIONAL_COMMENT = /^<!\[/;
/**自定义内容匹配规则 */
const RE_CUSTOM = new RegExp(
    `^@((([${COMMANDGROUPKEYS.join(
        "|"
    )}])\\s*(\\(.*\\))\\s*{)|([a-zA-Z_][-_.0-9a-zA-Z]*(\\[.*\\])*(\\s*\\(.*\\))*)|(\\(.*\\)))\\s*`
);
/**分组括号索引查找正则 */
const RE_GROUP_FINDINDEX = /(([^\S\r\n]*)(?<group>{|}){1})/;
/**分组括号匹配正则 */
const RE_GROUP = /^(([^\S\r\n]*)(?<group>{|}){1})/;
/**自定义内容匹配规则-- 条件类-else if else 标记 */
const RE_CUSTOM_CONDITION_ELSE_TAG = /^([\s\r\n]*)(?<tag>(else\s+if)|(else))\s*(\((?<param>(.*))\))*\s*\{/;
//#endregion
/**特殊语法标记开始 */
const CUSTOMTAG = "@";
//特殊标记，内容区域不做处理
export const TAG_PLAINTEXT_ELEMENT = ["script", "style", "textarea", "pre"];

// HTML5中的可以不写 endTag 的那些元素的集合, 例如 <input /> <link />
const TAG_UNARYTTAG_ELEMENT = [
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "frame",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "embed",
    "command",
    "keygen",
    "source",
    "track",
    "wbr"
];

export class HTMLParser {
    /**索引 */
    private index: number = 0;
    /**tag闭合链接 */
    private tagLinks: Array<{
        tagName: string;
        tag: string;
        start: number;
        attrs: Array<any>;
        end?: number;
    }> = [];
    /**自定义组别链接 */
    private customGroupLinks: Array<CustomLinkItem> = [];
    private prevHtml: string = "";
    /**最后一个未闭合标签tag */
    private lastTag: string = "";

    /**动态标记匹配正则数组，做数据缓存，相同标记不用生成新的正则 */
    public static dyTagNameCloseRegExp: { [key: string]: RegExp } = {};
    constructor(private html: string, private option: HTMLParserOption) {
        while (this.html) {
            this.prevHtml = this.html;

            //要么没有lastTag || 有lastTag，并且不是script|style|textarea 特殊标签
            if (!this.lastTag || !this.isPlaintextElement(this.lastTag)) {
                let arrow_l_index = this.html.indexOf("<");
                let custom_index = this.html.indexOf(CUSTOMTAG);

                if (arrow_l_index === 0) {
                    if (this.checkComment()) continue;

                    if (this.checkConditionalComment()) continue;

                    if (this.checkDocType()) continue;

                    if (this.checkEndTag()) continue;

                    if (this.checkStartTag()) continue;
                }
                //检测特殊符号
                else if (this.checkCustom()) continue;
                //Group End
                else if (this.checkCustomEnd()) continue;

                let text: string = "";

                //group {} 索引

                let groupIndex = this.html.match(RE_GROUP_FINDINDEX)?.index ?? -1;

                let nexTagIndex = Math.min(...[arrow_l_index, custom_index, groupIndex].filter((m) => m > -1));
                if (nexTagIndex >= 0) {
                    //取最小匹配值
                    let nextContent = this.html.slice(nexTagIndex);

                    while (
                        RE_ENDTAG.test(nextContent) === false &&
                        RE_STARTTAGOPEN.test(nextContent) === false &&
                        RE_COMMENT.test(nextContent) === false &&
                        RE_CONDITIONAL_COMMENT.test(nextContent) == false &&
                        RE_CUSTOM.test(nextContent) === false &&
                        //group tag {|} 用于标记{}开始结束
                        RE_GROUP.test(nextContent) === false
                    ) {
                        let nextArrowIndex = nextContent.indexOf("<", 1);
                        let nextCustomIndex = nextContent.indexOf(CUSTOMTAG, 1);
                        let nextGroupIndex = nextContent.match(RE_GROUP_FINDINDEX)?.index ?? -1;

                        if (nextArrowIndex === -1 && nextCustomIndex === -1 && nextGroupIndex == -1) break;

                        nexTagIndex += Math.min(...[nextArrowIndex, nextCustomIndex, nextGroupIndex]);

                        nextContent = this.html.slice(nexTagIndex);
                    }

                    text = this.html.substring(0, nexTagIndex);
                } else {
                    text = html;
                }

                if (arrow_l_index === 0 && !text) {
                    //可能是纯<
                    text = "<";
                }

                if (text) {
                    this.next(text.length);

                    this.option.onChars && this.option.onChars(text, this.index - text.length, this.index);
                }
            } else {
                let endTagLength = 0;
                let lastTagName = this.lastTag.toLowerCase();

                let re_lastTag =
                    HTMLParser.dyTagNameCloseRegExp[lastTagName] ||
                    (HTMLParser.dyTagNameCloseRegExp[lastTagName] = new RegExp(
                        `([\\s\\S]*?)(</${lastTagName}[^>]*>)`,
                        "i"
                    ));

                let newHtml = this.html.replace(re_lastTag, (substring, value, endTag) => {
                    endTagLength = endTag.length;

                    if (this.isPlaintextElement(lastTagName) === false) {
                        value = value.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, "$1$2");
                    }

                    this.option.onChars && this.option.onChars(value);
                    return "";
                });

                this.index += this.html.length - newHtml.length;
                this.html = newHtml;

                this.parserEndTag(lastTagName, this.index - endTagLength, this.index);
            }

            //如果没有任何匹配，则作为字符处理
            if (this.html === this.prevHtml) {
                this.option.onChars && this.option.onChars(this.html);
            }
        }

        //while循环完毕后，清理未闭合不合规标签
        this.parserEndTag();
        //清理未完成的特殊标记语法
        this.parseCustomEnd();
    }

    /**
     * 解析注释文本
     */
    private checkComment(): boolean {
        if (RE_COMMENT.test(this.html)) {
            let commentEndIndex = this.html.indexOf("-->");

            if (commentEndIndex > -1) {
                if (this.option.keepComment && this.option.onComment) {
                    this.option.onComment(
                        this.html.substring(4, commentEndIndex),
                        this.index,
                        this.index + commentEndIndex + 3
                    );
                }

                this.next(commentEndIndex + 3);
                return true;
            }
        }
        return false;
    }

    /**
     * 解析条件注释
     */
    private checkConditionalComment(): boolean {
        if (RE_CONDITIONAL_COMMENT.test(this.html)) {
            let conditionalEndIndex = this.html.indexOf("]>");

            if (conditionalEndIndex > -1) {
                this.next(conditionalEndIndex + 2);
                return true;
            }
        }
        return false;
    }

    /**
     * 解析DocType
     */
    private checkDocType(): boolean {
        let docTypeMatch = this.html.match(RE_DOCTYPE);

        if (docTypeMatch) {
            this.next(docTypeMatch[0].length);
            return true;
        }
        return false;
    }

    /**
     * 检查自定义标记
     */
    private checkCustom(): Boolean {
        //@自定义标记正则
        let customMatch = this.html.match(RE_CUSTOM);

        if (customMatch) {
            let startIndex = this.index;

            let strExpress = customMatch[1];

            let funcCodeResult = matchUtils.recursive(strExpress, "(...)", false, true);
            //group 分组标记，不会去判断小括号完整性，完全按照{ 作为结尾符号
            let groupReg = new RegExp(`^(${COMMANDGROUPKEYS.join("|")})`);

            if (groupReg.test(strExpress)) {
                this.next(customMatch[0].length + 1);
            } else if (funcCodeResult.length) {
                let funcCodeItem = funcCodeResult[0];
                strExpress = strExpress.substring(0, funcCodeItem.index + funcCodeItem.value.length);
                this.next((CUSTOMTAG + strExpress).length);
            } else {
                this.next((CUSTOMTAG + strExpress).length);
            }
            this.parserCustom(strExpress, startIndex, this.index);
            return true;
        }

        return false;
    }

    private parserCustom(val: string = "", startIndex: number = 0, endIndex: number = 0) {
        let reg = /^(?<key>[0-9a-zA-Z_][-_.0-9a-zA-Z]*(\[.*\])*)?\s*(\((?<param>.*)\))?/;

        let transfromKeyWord = val.match(reg);
        if (transfromKeyWord && transfromKeyWord.groups) {
            //如果没有KEY 则代表 (xx) 为代码块
            let key = transfromKeyWord.groups["key"];
            let param = transfromKeyWord.groups["param"];
            let isGroup = COMMANDGROUPKEYS.some((m) => m === key);
            this.option.onCustomStart && this.option.onCustomStart(val, key, param, isGroup, startIndex, endIndex);

            if (isGroup) {
                this.customGroupLinks.push({
                    val: val,
                    key: key,
                    param: param,
                    isGroup: isGroup,
                    start: startIndex,
                    end: endIndex
                });
            }
        } else {
            this.option.onWarn &&
                this.option.onWarn("动态关建符解析错误", {
                    str: val,
                    start: startIndex,
                    end: endIndex
                });
        }
    }

    //检查自定义标记结束
    private checkCustomEnd(): boolean {
        let groupMatch = this.html.match(RE_GROUP);
        if (groupMatch && groupMatch.groups) {
            let tag = groupMatch.groups["group"];
            let text = groupMatch[0];

            this.next(text.length);
            if (this.customGroupLinks.length) {
                if (tag === "{") {
                    this.customGroupLinks.push({
                        isGroup: false,
                        start: this.index - text.length,
                        end: this.index
                    });
                } else {
                    let last = this.customGroupLinks.pop();
                    if (last && last.isGroup) {
                        this.parseCustomEnd(last);
                        text = "";
                    }
                }
            }

            if (text) {
                this.option.onChars && this.option.onChars(text, this.index - text.length, this.index);
            } else if (tag === "}") {
                //必须是指令闭合，而不是字符串闭合
                //如果是结束集合，则考虑else分支判断集合正则匹配
                this.checkConditionElseTag();
            }

            return true;
        }
        return false;
    }

    private checkConditionElseTag() {
        let conditionMatch = this.html.match(RE_CUSTOM_CONDITION_ELSE_TAG);
        if (conditionMatch && conditionMatch.groups?.tag) {
            let cmdName = conditionMatch.groups.tag.replace(/\s/g, "");

            let text = conditionMatch[0];
            if (cmdName === "elseif" || cmdName === "else") {
                let param = cmdName === "elseif" ? conditionMatch.groups.param : "";

                this.option.onCustomStart &&
                    this.option.onCustomStart(text, cmdName, param, true, this.index, this.index + text.length);

                this.customGroupLinks.push({
                    val: text,
                    key: cmdName,
                    param: param,
                    isGroup: true,
                    start: this.index,
                    end: this.index + text.length
                });

                this.next(text.length);
            }
        }
    }

    private parseCustomEnd(lastItem?: CustomLinkItem) {
        if (lastItem) {
            this.option.onCustomEnd &&
                this.option.onCustomEnd(
                    lastItem.val as string,
                    lastItem.key as string,
                    lastItem.param as string,
                    true,
                    this.index - 1,
                    this.index
                );
        } else {
            this.customGroupLinks.forEach((m) => {
                if (m.isGroup) {
                    this.option.onWarn &&
                        this.option.onWarn(`特定语法标记<${m.val}>没有找到闭合标签`, { start: m.start, end: m.end });

                    this.option.onCustomEnd &&
                        this.option.onCustomEnd(m.val as string, m.key as string, m.param as string, true, 0, 0);
                }
            });

            this.customGroupLinks = [];
        }
    }

    /**
     * 解析结束节点
     */
    private checkEndTag(): boolean {
        let endTagMath = this.html.match(RE_ENDTAG);

        if (endTagMath) {
            let startIndex = this.index;

            this.next(endTagMath[0].length);

            this.parserEndTag(endTagMath[1], startIndex, this.index);

            return true;
        }
        return false;
    }

    /**
     * 解析结束标签
     * @param {string} tagName tagName
     * @param {number} startIndex 开始索引
     * @param {number} endIndex 结束索引
     */
    private parserEndTag(tagName: string = "", startIndex: number = 0, endIndex: number = 0) {
        let pos: number = 0;

        if (tagName) {
            //转换小写存储
            tagName = tagName.toLowerCase();

            for (pos = this.tagLinks.length - 1; pos >= 0; pos--) {
                if (this.tagLinks[pos].tagName === tagName) {
                    break;
                }
            }
        }

        //不是自闭和标签 例如<br /> 或做清理操作时(tagName="")
        if (pos > -1) {
            for (let i = this.tagLinks.length - 1; i >= pos; i--) {
                //找到在当前位置之前的未闭合标签
                if ((i > pos || tagName === "") && this.option.onWarn) {
                    let item = this.tagLinks[i];
                    this.option.onWarn(`标签<${item.tag}>没有找到闭合标签`, {
                        start: item.start,
                        end: item.end
                    });
                }

                this.option.onTagEnd && this.option.onTagEnd(this.tagLinks[i].tag, startIndex, endIndex);
            }

            //设置完成后，清理链路数据
            this.tagLinks.length = pos;
            this.lastTag = pos ? this.tagLinks[pos - 1].tag : "";
        }
    }

    /**
     * 解析开始标签
     */
    private checkStartTag(): boolean {
        let startTag = this.getStartTag();
        if (startTag) {
            this.parserStartTag(startTag);

            return true;
        }
        return false;
    }

    /**
     * 获取开始节点
     */
    private getStartTag(): StartTagModel | void {
        let startMatch = this.html.match(RE_STARTTAGOPEN);
        if (startMatch && startMatch.index === 0) {
            let result: StartTagModel = {
                tagName: startMatch[1],
                attrs: [],
                startIndex: this.index,
                endIndex: -1
            };

            this.next(startMatch[0].length);

            let end: RegExpMatchArray | null;
            let attr: RegExpMatchArray | null;
            while (
                //非开始标签结尾闭合
                (end = this.html.match(RE_STARTTAGCLOSE)) === null &&
                //获取attr
                (attr = this.html.match(RE_ATTRIBUTE))
            ) {
                let attrStartIndex = this.index;

                this.next(attr[0].length);

                result.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5],
                    start: attrStartIndex,
                    end: this.index
                });
            }

            if (end) {
                this.next(end[0].length);

                result.unarySlash = end[1];
                result.endIndex = this.index;

                return result;
            }
        }
    }

    /**
     * 解析开始节点
     * @param startTag 开始节点
     */
    private parserStartTag(startTag: StartTagModel) {
        let unary: boolean = !!startTag.unarySlash || this.isUnaryTag(startTag.tagName);
        let attrs = new Array();
        for (let i = 0; i < startTag.attrs.length; i++) {
            let attr = startTag.attrs[i];

            attrs.push(attr);
        }

        //如果不是自闭合则需要记录链路
        if (unary === false) {
            this.tagLinks.push({
                tag: startTag.tagName,
                tagName: startTag.tagName.toLowerCase(),
                start: startTag.startIndex,
                end: startTag.endIndex,
                attrs: attrs
            });

            this.lastTag = startTag.tagName;
        }

        this.option.onTagStart &&
            this.option.onTagStart(startTag.tagName, startTag.attrs, unary, startTag.startIndex, startTag.endIndex);
    }

    /**
     * 设置下一个循环索引
     * @param {number} val 索引
     */
    private next(val: number) {
        this.index += val;
        this.html = this.html.substring(val);
    }

    /**
     * 判断是否是大文本标签
     * @param {string} tagName 标签名称
     */
    private isPlaintextElement(tagName: string): boolean {
        return !!tagName && TAG_PLAINTEXT_ELEMENT.indexOf(tagName) > -1;
    }

    /**
     * 检查是否是自闭合标签
     * @param tagName 标签名称
     */
    private isUnaryTag(tagName: string): boolean {
        return !!tagName && TAG_UNARYTTAG_ELEMENT.indexOf(tagName) > -1;
    }
}

type CustomLinkItem = {
    val?: string;
    key?: string;
    param?: string;
    isGroup: boolean;
    start: number;
    end: number;
};

type StartTagModel = {
    tagName: string;
    startIndex: number;
    endIndex: number;
    attrs: Array<{
        name: string;
        value: string;
        start: number;
        end: number;
    }>;
    unarySlash?: string;
};

type HookFunctionType = (val: string, startIndex?: number, endIndex?: number) => void;

export type HTMLParserOption = {
    /**保留注释 */
    keepComment?: boolean;
    /**注释内容回调 */
    onComment?: HookFunctionType;
    /**结束标签 */
    onTagEnd?: HookFunctionType;
    /**字符 */
    onChars?: HookFunctionType;
    /**开始标签 */
    onTagStart?: (val: string, attrs: Array<any>, isUnary: boolean, startIndex: number, endIndex: number) => void;
    /**特殊关键字开始 */
    onCustomStart?: (
        val: string,
        key: string,
        param: string,
        isGroup: boolean,
        startIndex: number,
        endIndex: number
    ) => void;
    /**特殊关键字结束 */
    onCustomEnd?: (
        val: string,
        key: string,
        param: string,
        isGroup: boolean,
        startIndex: number,
        endIndex: number
    ) => void;
    /**警告处理 */
    onWarn?: (errmsg: string, info: { [key: string]: any }) => void;
};
