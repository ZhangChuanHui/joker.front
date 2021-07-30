import { AST, ASTNODETYPE } from ".";
import { stringUtils } from "@joker/shared";
import { transformEvent } from "./dynamic/event";
import { analyAttribute } from "./dynamic/attr";

export function createElement(tagName: string, attr?: { [key: string]: string }, childrens?: Array<AST>): AST {
    if (stringUtils.isEmpty(tagName)) throw new Error("createElement 方法必须传入tagName");

    let result: AST = {
        tagName: tagName,
        childrens: childrens,
        type: ASTNODETYPE.ELEMENT
    };

    analyElemenet(result, attr);

    return result;
}

function analyElemenet(ast: AST, attr?: { [key: string]: string }) {
    if (attr) {
        for (let name in attr) {
            let key = name.trim();

            if (key.startsWith("@")) {
                ast.events = ast.events || [];
                ast.events.push(transformEvent(key.substring(1), attr[name] ?? ""));
            } else {
                ast.attrs = ast.attrs || [];
                ast.attrs.push(analyAttribute(key, attr[name]));
            }
        }
    }
}
