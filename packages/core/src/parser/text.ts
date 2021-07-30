import { TextNodeInfo } from "./node";
import { IParser } from "./parser";

export class ParserText extends IParser {
    public parser(): void {
        this.node = new TextNodeInfo(this.ast.data, this.parent);

        this.addSelfNode();
    }
}
