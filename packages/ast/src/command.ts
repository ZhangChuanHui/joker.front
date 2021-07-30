import { stringUtils } from "@joker/shared";
import { AST, ASTNODETYPE } from ".";
import { createFuntionBody } from "./dynamic/express";

export const CODEFUNCTIONTAGS = "Text";

export const COMMANDGROUPKEYS = ["if", "elseif", "else", "for", "foreach", "section"];

/**let any in|of any */
const RE_FORLETINOF = /^let\s+(?<variable>(.*))\s+(?<keyword>(in|of))\s+(?<aimObj>.*)/;
/**带条件的for循环 */
const RE_FORCONDITION = /^let\s+(?<variable>.*);(?<condition>.*);(?<step>.*)/;
/**声明变量规则 */
const RE_LET = /^[0-9a-zA-Z_]+$/;
//不需要参数的命令
const COMMANDGROUPNOTNEEDPARAMKEYS = ["else", "section"];

export function createCommand(cmdName: string, param?: string, childrens?: Array<AST>): AST {
    if (stringUtils.isEmpty(cmdName)) throw new Error("缺少命令名称");

    //这里不会存在空字符串，因为空字符串带引号，这里是表达式，不是运行时
    param = (param || "").trim();

    //不做param空判断，因为有空参数调用

    let result: Partial<AST> = {
        type: ASTNODETYPE.COMMAND,
        tagName: cmdName,
        data: param
    };

    if (CODEFUNCTIONTAGS === cmdName) {
        throw new Error(`${CODEFUNCTIONTAGS}为代码块关键字，如想使用代码块请使用createCodeFunction方法`);
    } else {
        //仅判断是否为undefined，为空参数调用做兼容处理
        if (COMMANDGROUPKEYS.indexOf(cmdName) > -1) {
            result.childrens = childrens || [];
        } else if (childrens && childrens.length) {
            console.warn(`${COMMANDGROUPKEYS.join(",")}特殊命令才允许有子集嵌套，已忽略子集`);
        }
    }

    transformExpressParam(result);

    return <AST>result;
}

function transformExpressParam(ast: Partial<AST>): void {
    if (ast.tagName === "for") {
        transformForExpressParam(ast);
        return;
    }

    if (ast.tagName === "section") {
        ast.params = (<string>(ast.data ?? "")).split(",").map((v) => {
            return (v || "").trim();
        });

        ast.sectionId = ast.params[0] ? eval(ast.params[0]) : ast.params[0];
        ast.params = (<Array<string>>ast.params).slice(1);
        return;
    }

    if (stringUtils.isEmpty(ast.data) === false) {
        ast.data = createFuntionBody(ast.data);
    }
}

function transformForExpressParam(ast: Partial<AST>): void {
    //@for(let i=0;i<ssss.length;i++)
    let expressStr = ast.data as string;

    let conditionMatch = expressStr.match(RE_FORCONDITION);
    if (conditionMatch && conditionMatch.groups) {
        let variable = (conditionMatch.groups.variable || "").trim();
        let condition = (conditionMatch.groups.condition || "").trim();
        let step = (conditionMatch.groups.step || "").trim();

        if (variable && condition && step) {
            let tempVal = variable.split("=");
            if (tempVal.length !== 2) throw new Error(`for命令声明let不符合:变量=值的规范要求;${variable}`);

            let letKey = tempVal[0].trim();
            let letKeyVal = tempVal[1].trim();

            if (checkLetKey(letKey) === false) return;

            if (letKeyVal === "") throw new Error("for命令声明let时，变量为设置起始值;" + variable);

            ast.data = {
                let: letKey,
                letVal: createFuntionBody(letKeyVal),
                key: "condition",
                step: createFuntionBody(step),
                condition: createFuntionBody(condition)
            };

            return;
        }
    }

    //@for(let index in sss)
    //@for(let item of sss)
    //@for(let (index,item) in ssss)
    let letInOfMatch = expressStr.match(RE_FORLETINOF);
    if (letInOfMatch && letInOfMatch.groups) {
        let variable = (letInOfMatch.groups.variable || "").trim();
        let keyword = (letInOfMatch.groups.keyword || "").trim();
        let aimObj = (letInOfMatch.groups.aimObj || "").trim();

        if (variable && keyword && aimObj) {
            let fullKeyParamMatch = variable.match(/^\((?<keys>.*)\)$/);

            let lets: Array<string>;
            if (fullKeyParamMatch && fullKeyParamMatch.groups?.keys) {
                lets = fullKeyParamMatch.groups.keys.split(",").map((m) => {
                    return m.trim();
                });
            } else {
                lets = [variable];
            }

            if (lets.length > 2) throw new Error(`for命令声明let最多只支持2位参数`);

            lets.forEach((m) => {
                checkLetKey(m);
            });

            ast.data = {
                lets: lets,
                key: keyword,
                obj: createFuntionBody(aimObj)
            };

            return;
        }
    }

    throw new Error("for循环参数不符合要求:" + expressStr);
}

function checkLetKey(key: string): boolean {
    if (RE_LET.test(key) === false)
        throw new Error(`for命令解析声明let时出现错误，变量声明必须是[0-9a-zA-Z_]组合:${key}`);
    return true;
}

export function createCodeFunction(code: string): AST {
    return {
        type: ASTNODETYPE.COMMAND,
        tagName: CODEFUNCTIONTAGS,
        data: createFuntionBody((code || "").trim())
    };
}
