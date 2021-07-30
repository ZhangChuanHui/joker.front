import { CommentNodeInfo, ElementNodeInfo, TextNodeInfo } from "./node";
import { IParser } from "./parser";

export class ParserComment extends IParser {
    public parser(): void {
        this.node = new CommentNodeInfo(this.ast.data, this.parent);

        this.addSelfNode();
    }
}
