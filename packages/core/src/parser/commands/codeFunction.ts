import { createFuntionBody } from "@joker/ast";
import { HtmlNodeInfo, TextNodeInfo } from "../node";
import { IParser } from "../parser";

export class ParserCodeFunctionCommand extends IParser {
    public parser(): void {
        if (this.ast.tagName === undefined) {
            throw new Error("ast运行表达式时，命令解析为空");
        }

        let codeFunction = (<any>this.ob)[this.ast.tagName];
        if (codeFunction && typeof codeFunction === "function") {
            this.initNodeInfo();

            let result = this.runExpressWithWatcher(
                //创建待运行的表达式
                `${createFuntionBody(this.ast.tagName)}(${this.ast.data})`,
                (val: any) => {
                    this.node && this.setNodeData(val);

                    this.node && this.templateParser.Render?.updateNode(this.node);
                }
            );

            this.setNodeData(result);

            this.addSelfNode();
        } else {
            throw new Error(
                `ast运行表达式时，tagName:${this.ast.tagName}，在组件和其继承链中未找到对应的[执行方法]；请检查。`
            );
        }
    }

    private initNodeInfo() {
        if (this.ast.tagName === "Html") {
            this.node = new HtmlNodeInfo("", this.parent);
        } else {
            this.node = new TextNodeInfo("", this.parent);
        }
    }

    private setNodeData(data: string) {
        if (this.ast.tagName === "Html") {
            (<HtmlNodeInfo>this.node).html = data;
        } else {
            (<TextNodeInfo>this.node).text = (data ?? "").toString();
        }
    }
}
