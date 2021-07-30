import { AST, ASTNODETYPE } from "@joker/ast";
import { parserCommand } from "./command";
import { ParserElement } from "./element";
import { INJECT_RENDER, IParser, IRender, ITemplateParser, NodeInfo } from "./parser";
import { IContainer } from "@joker/shared";
import { checkIsComponent } from "./component";
import { ParserText } from "./text";
import { ParserComment } from "./comment";

export class TemplateParser implements ITemplateParser {
    public nodes: Array<NodeInfo> = [];

    public Render?: IRender;

    constructor(private asts: Array<AST>, ob: any, injectRender: boolean = false) {
        if (injectRender) {
            //需要隔离初始化，Render本身有数据存储和数据关联，不能做成工厂模式
            this.Render = IContainer.get(INJECT_RENDER);
        }

        this.renderNodes(asts, ob);
    }

    public mount(root: any): void {
        this.Render?.mount(root);
    }

    public dispose() {
        this.asts.forEach((ast) => {
            if (ast?.parserHandler) {
                let parser = <IParser>ast.parserHandler;

                parser.dispose();
            }
        });
        this.nodes.length = 0;
        this.asts.length = 0;
    }

    public renderNodes(asts: Array<AST>, ob: any, parent?: NodeInfo) {
        asts.forEach((ast) => {
            switch (ast.type) {
                case ASTNODETYPE.COMMAND:
                    parserCommand(asts, ast, ob, this, parent);
                    break;
                case ASTNODETYPE.COMMENT:
                    new ParserComment(asts, ast, ob, this, parent).parser();
                    break;
                case ASTNODETYPE.ELEMENT:
                    if (ast.tagName === undefined) {
                        throw new Error("ast渲染时，ast<Element>节点没有TagName");
                    }

                    if (checkIsComponent(asts, ast, ob, this, parent)) break;

                    new ParserElement(asts, ast, ob, this, parent).parser();
                    break;
                case ASTNODETYPE.TEXT:
                    new ParserText(asts, ast, ob, this, parent).parser();
                    break;
            }
        });
    }
}
