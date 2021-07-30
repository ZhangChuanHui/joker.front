import { ConditionNodeInfo } from "../node";
import { IParser } from "../parser";

export class ParserConditionCommand extends IParser {
    private state?: boolean;

    public links: Array<ParserConditionCommand> = [];

    public declare node: ConditionNodeInfo;

    public parser(): void {
        this.node = new ConditionNodeInfo(this.parent);
        let value = this.runExpressWithWatcher(this.ast.data, (val: any) => {
            this.node.condition = !!val;

            this.reloadLink();
        });

        this.node.condition = !!value;

        this.setLinkHandler();
        this.addSelfNode();
        this.renderConditionChildren();
    }

    protected renderConditionChildren(val?: boolean) {
        let checkResult = val ?? this.checkCondition();
        //状态无变化则不执行
        if (checkResult !== (this.state ?? false)) {
            this.state = checkResult;

            if (checkResult) {
                if (this.ast.childrens && this.ast.childrens.length) {
                    this.templateParser.renderNodes(this.ast.childrens, this.ob, this.node);
                }
            } else {
                this.disposeAsts();
            }
        }
    }

    //#region  逻辑链路管理
    //条件逻辑，都是串行的，找到根节点，并设置队列数据，减少每次变更带来的链路查找
    private setLinkHandler() {
        let prevIndex = this.asts.indexOf(this.ast);

        if (this.ast.tagName === "if") {
            this.links.push(this);
        } else {
            while (true) {
                prevIndex--;
                if (prevIndex < 0) break;

                let ast = this.asts[prevIndex];

                if (ast) {
                    if (ast.tagName === "if") {
                        ast.parserHandler.links.push(this);
                        this.links = ast.parserHandler.links;
                        break;
                    } else if (ast.tagName === "elseif") {
                        continue;
                    }
                }
                throw new Error("if,elseif,else必须是连续的指令，不能在中间穿插其他元素或命令");
            }
        }
    }

    private getLink(): Array<ParserConditionCommand> {
        return this.links || [];
    }
    //#endregion

    //#region  首次 逻辑链 逻辑
    private checkCondition(): boolean {
        if (this.ast.tagName === "if") {
            return this.node.condition;
        }
        //最后一个else 或者 当前跳转值为true
        else if (this.node.condition || this.ast.tagName === "else") {
            let linkVals = this.getPrevConditionLinkValue();

            if (linkVals.some((m) => m)) return false;
            if (this.ast.tagName === "else") return true;
            return this.node.condition;
        }

        return false;
    }

    private getPrevConditionLinkValue(): Array<Boolean> {
        let result: Array<boolean> = [];

        let links = this.getLink();

        for (let i = 0; i < links.length; i++) {
            let item = links[i];

            if (item === this) break;

            result.push(item.node.condition);
        }

        return result;
    }
    //#endregion

    //#region  变更监听
    public refreshConditionValue(val?: boolean): boolean {
        //可以指定值，用于上级为true时，所有队列下的数据都应该直接赋值false
        this.node.condition = val ?? !!this.runExpress(this.ast.data);
        return this.node.condition;
    }

    private reloadLink() {
        let hasTrue = false;
        this.getLink().forEach((item) => {
            let newValue = hasTrue ? false : item.refreshConditionValue();

            if (newValue) hasTrue = true;

            if (item.ast.tagName === "else" && hasTrue === false) {
                //如果是最后一个节点，并没有true，则使其强制为true

                newValue = true;
            }
            item.renderConditionChildren(newValue);
        });
    }
    //#endregion
}
