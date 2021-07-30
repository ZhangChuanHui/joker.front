import { AST } from "@joker/ast";
import { EXPRESSHANDLERTAG } from "@joker/ast";
import { arrayUtils, objectUtils, stringUtils } from "@joker/shared";
import { Component, NodeChangeType } from "../component";
import { Watcher } from "../observer/watcher";
import { ComponentNodeInfo, ElementNodeInfo } from "./node";

export interface ITemplateParser {
    nodes: Array<NodeInfo>;

    Render?: IRender;

    renderNodes(asts: Array<AST>, ob: object, parent?: NodeInfo): void;
}

export abstract class IParser {
    public node?: NodeInfo;
    public watchers: Array<Watcher> = [];

    constructor(
        public asts: Array<AST>,
        public ast: AST,
        public ob: Component,
        protected templateParser: ITemplateParser,
        public parent?: NodeInfo
    ) {
        ast.parserHandler = this;
    }

    //#region  渲染子集
    protected renderChildren() {
        if (this.ast.childrens && this.ast.childrens.length) {
            this.templateParser.renderNodes(this.ast.childrens, this.ob, this.node);
        }
    }

    public abstract parser(): void;
    //#endregion

    //#region  自身节点操作
    public addSelfNode() {
        if (this.node === undefined) return;

        if (this.parent) {
            this.parent.childrens = this.parent.childrens || [];
            this.parent.childrens.push(this.node);
        } else {
            this.templateParser.nodes.push(this.node);
        }

        this.templateParser.Render?.appendNode(this.node);

        this.nodeChangeNotify(NodeChangeType.APPEND);
    }

    public removeSelfNode() {
        if (this.node) {
            if (this.node instanceof ElementNodeInfo || this.node instanceof ComponentNodeInfo) {
                this.removeRef(this.node);
            }

            this.templateParser.Render?.removeNode(this.node);

            if (this.parent) {
                this.parent.childrens && arrayUtils.without(this.parent.childrens, this.node);
            } else {
                arrayUtils.without(this.templateParser.nodes, this.node);
            }

            this.nodeChangeNotify(NodeChangeType.REMOVE);
        }
    }
    //#endregion

    //#region  销毁

    public dispose() {
        if (this.ast.parserHandler === undefined) return;

        this.selfDispose();

        this.disposeAsts();

        this.removeSelfNode();

        this.clearWatchs();

        this.node = undefined;
        this.parent = undefined;

        delete this.ast.parserHandler;
    }

    public selfDispose() {}

    public disposeAsts(asts?: Array<AST>) {
        if (this.ast.parserHandler === undefined) return;

        // 销毁ast 子集
        (asts ?? this.ast.childrens)?.forEach((m) => {
            if (m.parserHandler) {
                (<IParser>m.parserHandler).dispose();
            }
        });
    }
    //#endregion

    //#region 表达式运算

    public runExpress(express: string, ob?: any): any {
        let expressFunction = this.createExpress(express);

        return expressFunction.call(ob ?? this.ob, ob ?? this.ob);
    }

    public runExpressWithWatcher(
        express: string,
        updateCallBack: Function,
        ob?: any,
        igChangeCheck?: boolean,
        filterEqual?: Boolean
    ): any {
        let expressFunction = this.createExpress(express);

        let watcher = new Watcher(ob ?? this.ob, expressFunction, updateCallBack, igChangeCheck);

        let value = watcher.value;

        //添加 watcher 时会有防重复和空dep判断
        this.addWatch(watcher, filterEqual);

        return value;
    }

    private createExpress(express: string): Function {
        try {
            return new Function(EXPRESSHANDLERTAG, "return " + express + ";");
        } catch (e) {
            throw new Error("表达式创建失败，表达式内容：" + express);
        }
    }
    //#endregion

    //#region  边缘方法
    private addWatch(watcher: Watcher, filterEqual?: Boolean) {
        //空引用 或者 重复“索引集” 排除销毁
        if (objectUtils.isEmpty(watcher.deps) || (filterEqual && this.checkWatcherDepEqual(watcher))) {
            watcher.dispose();
            return;
        }

        this.watchers.push(watcher);
    }

    private checkWatcherDepEqual(watcher: Watcher): boolean {
        let keys = Object.keys(watcher.deps);
        for (let i = 0; i < this.watchers.length; i++) {
            let item = this.watchers[i];

            let hasDiff = false;
            for (let key in item.deps) {
                if (keys.indexOf(key) === -1) {
                    hasDiff = true;
                    break;
                }

                Object.keys(item.deps[key]).forEach((propertyKey) => {
                    if (watcher.deps[key][propertyKey] === undefined) {
                        hasDiff = true;
                        return;
                    }
                });

                if (hasDiff) break;
            }

            if (hasDiff) continue;

            return true;
        }

        return false;
    }

    protected clearWatchs() {
        this.watchers.forEach((w) => {
            w.dispose();
        });
        this.watchers.length = 0;
    }

    protected ref?: string;

    protected addRef(refName: string, node: NodeInfo) {
        this.ob.refs[refName] = this.ob.refs[refName] || [];

        this.ob.refs[refName].push(node);

        this.ref = refName;
    }

    protected nodeChangeNotify(type: NodeChangeType): void {
        if (stringUtils.isEmpty(this.ref) === false) {
            this.ob.__nodeChangeListener__.forEach((m) => {
                if (m.ref === this.ref) {
                    this.node && m.callBack(this.node, type);
                }
            });
        }
    }

    protected removeRef(node: NodeInfo) {
        for (let refName in this.ob.refs) {
            if (this.ob.refs[refName]) {
                arrayUtils.without(this.ob.refs[refName], node);
            }
        }
    }
    //#endregion
}

export class NodeInfo {
    constructor(public nodeType: NodeType, public parent?: NodeInfo) {}
    childrens?: Array<NodeInfo>;
    watchs?: Array<Watcher>;
    /**
     * 产出元素
     */
    el: any;
}

export enum NodeType {
    ELEMENT,
    COMMANDGROUP,
    COMMENT,
    TEXT,
    HTML
}

export const INJECT_RENDER: symbol = Symbol("INJECT_RENDER");

/**
 * 备注：在渲染时执行appendNode，最终执行一次mount挂载
 * 不会出现根目录append的场景，因为指令group会优先占位
 */
export interface IRender {
    /**
     * 挂载
     * @param root 挂载根
     * 不限制root类型，为后面做多端兼容
     */
    mount(root: any): void;
    /**
     * 添加节点
     * @param node NodeInfo
     * @param parent 父节点
     */
    appendNode(node: NodeInfo): void;
    /**
     * 更新节点
     * @param node NodeInfo
     */
    updateNode(node: NodeInfo): void;
    /**
     * 删除节点
     * @param node NodeInfo
     * @param parent? NodeInfo 如果为空则带表root跟节点下集
     */
    removeNode(node: NodeInfo): void;
}
