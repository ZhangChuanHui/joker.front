import { IParser, ITemplateParser, NodeInfo } from "./parser";
import { AST, ASTNODETYPE } from "@joker/ast";
import { ComponentNodeInfo, NodeEvent } from "./node";
import { Component, ComponentItemType, getComponentByName, NodeChangeType, SectionType } from "../component";
import { Observer } from "../observer/observer";
import { objectUtils, stringUtils } from "@joker/shared";
import { DEFAULT_SECTION_TAG } from "./commands/section";

export function checkIsComponent(
    asts: Array<AST>,
    ast: AST,
    ob: Component,
    templateParser: ITemplateParser,
    parent?: NodeInfo
) {
    //先按私有组件渲染 ->//全局组件渲染
    let componentName = ast.tagName as string;
    let ComponentHandler = ob.components[componentName] || getComponentByName(componentName);
    if (ComponentHandler) {
        new ParserComponentCommand(asts, ast, ob, templateParser, ComponentHandler, parent).parser();
        return true;
    }
    return false;
}

export class ParserComponentCommand extends IParser {
    protected componentHandler?: Component;
    public declare node: ComponentNodeInfo;
    private propValues: { [key: string]: any } = {};
    constructor(
        public asts: Array<AST>,
        public ast: AST,
        public ob: Component,
        protected templateParser: ITemplateParser,
        public component: ComponentItemType,
        public parent?: NodeInfo
    ) {
        super(asts, ast, ob, templateParser, parent);

        this.node = new ComponentNodeInfo(this.parent);
    }

    public parser(): void {
        this.propValues = {};

        this.ast.attrs?.forEach((attr) => {
            let attrVal = attr.str;

            if (attr.key === "ref") {
                if (stringUtils.isEmpty(attrVal)) {
                    throw new Error("ref 值不能为空");
                }
                this.addRef(attrVal, this.node);
                return;
            }

            if (attr.expressValue) {
                attrVal = this.runExpressWithWatcher(attr.expressValue, (val: any) => {
                    this.propValues[attr.key] = val;

                    this.nodeChangeNotify(NodeChangeType.UPDATE);
                });
            }

            this.propValues[attr.key] = attrVal;
        });

        this.propValues = new Observer(this.propValues).proxyObj;

        this.node.attrs = this.propValues;

        this.addSelfNode();

        this.componentHandler = new this.component();

        this.componentHandler.sections = this.childrenAstTransform();

        this.componentHandler.ComponentInitialize(this.node, this.propValues);

        this.ast.events?.forEach((event) => {
            let componentCallBack = (<any>this.ob)[event.eventFunctionName];
            if (componentCallBack && typeof componentCallBack === "function") {
                this.node.events.push({
                    name: event.eventName,
                    decorates: event.eventDecorates,
                    callBack: (e: NodeEvent) => {
                        let params: Array<any> = [];
                        if (event.eventFunctionParam) {
                            params = this.runExpress(`[${event.eventFunctionParam}]`);
                        }
                        <Function>componentCallBack(e, ...params);
                    }
                });
            } else {
                throw new Error(`在组件中未找到${event.eventFunctionName}的事件，或该属性不是可执行方法`);
            }
        });

        this.node.component = this.componentHandler;
    }

    public selfDispose() {
        this.componentHandler?.ComponentDispose();
    }

    private childrenAstTransform(): {
        [key: string]: SectionType;
    } {
        let sections: {
            [key: string]: SectionType;
        } = {};

        if (this.ast.childrens && this.ast.childrens.length) {
            //只采集一级
            for (let ast of this.ast.childrens) {
                if (ast.type === ASTNODETYPE.COMMAND && ast.tagName === "section" && ast.childrens?.length) {
                    let sectionParams = ast.params;
                    let sectionId = ast.sectionId || DEFAULT_SECTION_TAG;

                    sections[sectionId] = sections[sectionId] || {
                        asts: [],
                        ob: this.ob,
                        params: sectionParams
                    };

                    sections[sectionId].asts = sections[sectionId].asts.concat(ast.childrens);
                } else {
                    sections[DEFAULT_SECTION_TAG] = sections[DEFAULT_SECTION_TAG] || {
                        asts: [],
                        ob: this.ob
                    };

                    sections[DEFAULT_SECTION_TAG].asts.push(ast);
                }
            }
        }

        for (let key in sections) {
            let item = sections[key];
            item.render = (parent: NodeInfo, renderOb: any) => {
                //renderOb为最终数据源，存储在RenderSection NodeInfo中，做双向通知
                let renderAsts = objectUtils.clone(item.asts);

                //新增
                this.templateParser.renderNodes(renderAsts, renderOb, parent);

                return renderAsts;
            };
        }

        return sections;
    }
}
