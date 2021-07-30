import { AST } from "@joker/ast";
import { arrayUtils, objectUtils } from "@joker/shared";
import { Observer } from "../../observer/observer";
import { ListItemNodeInfo, ListNodeInfo } from "../node";
import { IParser,  NodeInfo, NodeType } from "../parser";

export class ParserListCommand extends IParser {
    private childrenAsts: Array<ListItem> = [];

    public node: ListNodeInfo = new ListNodeInfo(this.parent);

    public parser(): void {
        this.addSelfNode();

        this.parserList();
    }

    public parserList() {
        switch (this.ast.data.key) {
            case "condition":
                this.parserTypeCondition();
                break;
            case "in":
            case "of":
                this.parserInOfCondition();
                break;
            default:
                throw new Error(
                    `列表循环表达式匹配错误，关键字不符合条件表达式或者in|of，解析Key为:${this.ast.data.key}`
                );
        }
    }

    private parserTypeCondition() {
        /**
         * 列表循环---条件类
         * let: letKey,
         * letVal: createFuntionBody(letKeyVal),
         * key: "condition",
         * step: createFuntionBody(step),
         * condition: createFuntionBody(condition)
         */

        let letKey = this.ast.data.let;

        let stepOb = Object.create(this.ob);

        //由于下面存在两个异常采集，并对应同一个更新机制，则采集机制需要过滤重复

        //这里也采用依赖采集，大部分场景值是写死的值，但也有指向模型对象的场景
        stepOb[letKey] = this.runExpressWithWatcher(this.ast.data.letVal, () => this.update(), stepOb, true, true);

        //只在首次运行时做一次依赖采集
        //并且采集对象一定是原型链，
        let breakVal = !!this.runExpressWithWatcher(this.ast.data.condition, () => this.update(), stepOb, true, true);

        let index = 0;
        while (breakVal) {
            let itemOb = Object.create(this.ob);

            itemOb[letKey] = stepOb[letKey];

            this.renderItem(itemOb, index++);

            //接下来的 所有循环执行的表达式都不做依赖采集，不支持表达式运行时分支场景
            //step值操作，不可使用watcher ，否则会出现死循环
            this.runExpress(this.ast.data.step, stepOb);

            breakVal = !!this.runExpress(this.ast.data.condition, stepOb);
        }

        while (this.childrenAsts.length > index) {
            let item = this.childrenAsts.pop();
            if (item) this.disposeItem(item);
            else break;
        }
    }

    private parserInOfCondition() {
        let key: string = this.ast.data.key;
        let lets: Array<string> = this.ast.data.lets;
        let objExpress: string = this.ast.data.obj;

        let index = 0;
        //#region 合法性校验
        if (((key === "in" && lets.length >= 1 && lets.length <= 2) || (key === "of" && lets.length === 1)) === false) {
            throw new Error(
                "列表表达式运行错误，请按照正确要求书写表达式，in关键字支持1-2个参数，of关键字必须存在一个参数定义；当前数据为：" +
                    JSON.stringify(this.ast.data)
            );
        }
        //#endregion

        let objData = this.runExpressWithWatcher(objExpress, () => this.update(), this.ob);

        if (objData) {
            if (Array.isArray(objData)) {
                objData.forEach((item) => {
                    let itemOb = Object.create(this.ob);

                    if (key === "in") {
                        itemOb[lets[0]] = index;

                        if (lets[1]) {
                            itemOb[lets[1]] = item;
                        }
                    } else {
                        itemOb[lets[0]] = item;
                    }

                    this.renderItem(itemOb, index++);
                });
            } else if (objectUtils.isPlainObject(objData)) {
                for (let key in objData) {
                    let itemOb = Object.create(this.ob);

                    if (key === "in") {
                        itemOb[lets[0]] = key;

                        if (lets[1]) {
                            itemOb[lets[1]] = objData[key];
                        }
                    } else {
                        itemOb[lets[0]] = objData[key];
                    }

                    this.renderItem(itemOb, index++);
                }
            }
        }

        while (this.childrenAsts.length > index) {
            let item = this.childrenAsts.pop();
            if (item) this.disposeItem(item);
            else break;
        }
    }

    private renderItem(ob: any, index: number) {
        if (this.ast.childrens === undefined) return;

        //每次循环 都要把子集合并在一起去渲染，因为存在if等集联命令
        //不需要把所有
        let forItemAsts = objectUtils.clone(this.ast.childrens);

        if (this.childrenAsts[index] === undefined) {
            let node: ListItemNodeInfo = new ListItemNodeInfo(this.node);

            this.node.childrens?.push(node);

            this.templateParser.Render?.appendNode(node);

            //做单属性依赖采集
            objectUtils.getOwnProperties(ob, (key: string, val: any) => {
                Observer.defineProperty(ob, key, val);
            });

            //新增
            this.templateParser.renderNodes(forItemAsts, ob, node);

            this.childrenAsts[index] = {
                ob: ob,
                asts: forItemAsts,
                node: node
            };
        } else {
            let oldItem = this.childrenAsts[index];

            //比对非原型属性值，原型链值无需对比，产出目标一致
            objectUtils.getOwnProperties(ob, (key: string, val: any) => {
                if (oldItem.ob[key] !== val) oldItem.ob[key] = val;
            });
        }
    }

    private disposeItem(listItem: ListItem) {
        this.disposeAsts(listItem.asts);

        this.templateParser.Render?.removeNode(listItem.node);

        this.node.childrens && arrayUtils.without(this.node.childrens, listItem.node);
    }

    public selfDispose() {
        this.childrenAsts.forEach((listItem) => {
            this.disposeItem(listItem);
        });
    }

    private update() {
        this.clearWatchs();

        this.parserList();
    }
}

type ListItem = {
    ob: any;
    asts: Array<AST>;
    node: NodeInfo;
};
