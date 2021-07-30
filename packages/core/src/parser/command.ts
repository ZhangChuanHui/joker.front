import { AST } from "@joker/ast";
import { ITemplateParser, NodeInfo } from "./parser";
import { ParserConditionCommand } from "./commands/condition";
import { ParserListCommand } from "./commands/list";
import { ParserCodeFunctionCommand } from "./commands/codeFunction";
import { Component } from "../component";
import { ParserRenderSectionCommand } from "./commands/section";

export function parserCommand(
    asts: Array<AST>,
    ast: AST,
    ob: Component,
    templateParser: ITemplateParser,
    parent?: NodeInfo
) {
    switch (ast.tagName) {
        case "if":
        case "elseif":
        case "else":
            new ParserConditionCommand(asts, ast, ob, templateParser, parent).parser();
            break;
        case "for":
            new ParserListCommand(asts, ast, ob, templateParser, parent).parser();
            break;
        case "RenderSection":
            new ParserRenderSectionCommand(asts, ast, ob, templateParser, parent).parser();
            break;
        case "section":
            throw new Error("section命令必须在组件内第一级子集中进行使用");
        default:
            new ParserCodeFunctionCommand(asts, ast, ob, templateParser, parent).parser();
            break;
    }
}
