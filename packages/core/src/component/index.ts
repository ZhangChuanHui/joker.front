import { AST } from "@joker/ast";
import { functionUtils, objectUtils } from "@joker/shared";
import { Observer } from "../observer/observer";
import { Watcher } from "../observer/watcher";
import { TemplateParser } from "../parser";
import { ComponentNodeInfo, NodeEvent } from "../parser/node";
import { NodeInfo } from "../parser/parser";

type KVA = { [key: string]: any };

export type PropValueType = String | ArrayConstructor | Number | Object | Function | Boolean | Symbol;

export type PropType = PropValueType | Array<PropValueType> | PropTypeFullModel;

export enum NodeChangeType {
    /**
     * 被添加
     */
    APPEND,
    /**
     * 被移除
     */
    REMOVE,
    /**
     * 属性有变更
     */
    UPDATE
}

type PropTypeFullModel = {
    type?: PropValueType | Array<PropValueType>;
    required?: Boolean;
    default?: any;
    validate?: (val: any) => Boolean;
};

export type SectionType = {
    asts: Array<AST>;
    __renderAsts?: Array<AST>;
    ob: any;
    params?: Array<string>;
    render?: (parent: NodeInfo, renderOb: any) => Array<AST>;
};

export class Component {
    //#region props/attr相关
    private __PROPSHANDLER__?: object;

    private __ATTRSHANDLER__?: object;

    private __ATTRDATAS__?: KVA;

    /**
     * props参数类型及约束
     */
    public propTypes: { [key: string]: PropType } = {};

    public get props(): KVA {
        let self = this;
        if (this.__PROPSHANDLER__ === undefined) {
            this.__PROPSHANDLER__ = new Proxy(
                {
                    NOTE: "PROP接管"
                },
                {
                    get(target: any, key: string, receiver: any) {
                        return self.__getPropValue__(key);
                    },
                    set(target: object, key: string | symbol, value: any): boolean {
                        throw new Error("props参数值不允许更改，只能通过组件传值方式进行传递");
                    }
                }
            );
        }
        return <KVA>this.__PROPSHANDLER__;
    }

    private __getPropValue__(key: string): any {
        if (this.propTypes[key]) {
            let propOption = this.propTypes[key];

            let value = this.__ATTRDATAS__?.[key];

            if (Array.isArray(propOption)) {
                this.__checkPropType__(key, propOption, value);
            } else if (objectUtils.isPlainObject(propOption)) {
                let _propOption = <PropTypeFullModel>propOption;

                if (_propOption.required && value === undefined) {
                    throw new Error(`props中key${key}是必须项，请检查`);
                }

                if (_propOption.type) {
                    this.__checkPropType__(key, _propOption.type, value);
                }

                if (_propOption.validate && _propOption.validate(value) === false) {
                    throw new Error(`props中key${key}的值校验错误`);
                }

                if (_propOption.default !== undefined && value === undefined) {
                    value = _propOption.default;
                }
            } else {
                this.__checkPropType__(key, propOption, value);
            }

            return value;
        } else {
            throw new Error(`props中key:${key}未声明`);
        }
    }

    private __checkPropType__(key: string, types: PropValueType | Array<PropValueType>, value: any): void {
        if (value === undefined) return;

        let checkTypes: Array<PropValueType> = Array.isArray(types) ? types : [types];

        let valueType = typeof value;
        for (let i = 0; i < checkTypes.length; i++) {
            let cName = (<Function>checkTypes[i]).name.toLowerCase();
            if (cName === valueType) {
                return;
            }
        }

        throw new Error(`props中key:${key}的类型不符合约束类型`);
    }

    public get attrs(): KVA {
        let self = this;
        if (this.__ATTRSHANDLER__ === undefined) {
            this.__ATTRSHANDLER__ = new Proxy(
                {
                    NOTE: "ATTRS接管"
                },
                {
                    get(target: any, key: string | symbol, receiver: any) {
                        return (<any>self.__ATTRDATAS__)?.[key];
                    },
                    set(target: object, key: string | symbol, value: any): boolean {
                        throw new Error("attrs参数值不允许更改，只能通过组件传值方式进行传递");
                    }
                }
            );
        }
        return <KVA>this.__ATTRSHANDLER__;
    }
    //#endregion

    public template?: Array<AST>;

    public model?: KVA;

    //#region  watchNode

    public __nodeChangeListener__: Array<{
        ref: string;
        callBack: (node: NodeInfo, type: NodeChangeType) => void;
    }> = [];

    /**
     * 监听Node变化，在挂载前注册时，首次渲染会触发，请按需使用
     * @param ref Node元素ref值
     * @param callBack Node变更回调函数
     */
    public watchNode(ref: string, callBack: (node: NodeInfo, type: NodeChangeType) => void) {
        this.__nodeChangeListener__.push({
            ref: ref,
            callBack: callBack
        });
    }

    //#endregion

    //#region watchValue
    private __watchersForValue__: Array<Watcher> = [];

    /**
     * 监听数据变换，只能监听数据劫持的对象（model、props等），必须在mounted中适用
     * @param express 表达式
     * @param callBack 变更后的回调函数
     */
    public watchValue(express: () => any, callBack: (nv?: any, ov?: any, watcher?: Watcher) => void) {
        let watcher = new Watcher(this, express, (newVal: any, oldVal: any) => {
            callBack(newVal, oldVal, watcher);
        });

        this.__watchersForValue__.push(watcher);
    }
    //#endregion

    //#region 组件相关/混入
    public refs: { [key: string]: Array<NodeInfo> } = {};

    public sections: { [key: string]: SectionType } = {};

    /**
     * 注册组件，只在当前组件内作为子组件呈现
     *
     * 注： 可在构造函数/beforeRender中进行修改，可实现复杂逻辑分支
     */
    public components: { [key: string]: ComponentItemType } = {};

    public mixins: { [key: string]: Component } = {};

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param param （可选）事件参数
     * @param targetEvent （可选）目标Event
     */
    public trigger(eventName: string, param?: any, targetEvent?: NodeEvent): void {
        if (this.root && this.root instanceof ComponentNodeInfo) {
            this.root.events.forEach((event) => {
                if (event.name !== eventName) return;

                event.callBack({
                    stopPropagation: targetEvent?.stopPropagation ?? functionUtils.empty,
                    preventDefault: targetEvent?.preventDefault ?? functionUtils.empty,
                    data: param,
                    target: targetEvent?.target ?? this.root
                });
            });
        }
    }

    //#endregion

    //#region 生命周期钩子函数

    /**
     * 渲染前自定义函数
     */
    protected beforeRender(): void {}

    /**
     * 渲染后自定义函数
     */
    protected render(): void {}

    /**
     * 挂载后自定义函数（呈现）
     * @param root 挂载节点（父节点）
     */
    protected mounted(root: any) {}

    /**
     * 销毁自定义函数
     */
    protected dispose(): void {}

    //#endregion

    //#region 渲染及模板操作
    protected templateParserHandler?: TemplateParser;

    public get nodes(): Array<NodeInfo> | undefined {
        return this.templateParserHandler?.nodes;
    }
    //#endregion

    //#region 外部触发声明周期事件
    public root?: any;
    /**
     * 组件核心生命周期触发事件（对外初始化）
     * @returns this
     */
    public ComponentInitialize(root?: any | NodeInfo, attrDatas?: KVA): Component {
        //mixins是向下挂载，不允许有parent、root等逆向操作
        for (let name in this.mixins) {
            this.mixins[name].ComponentInitialize();
        }

        if (this.model) {
            this.model = new Observer(this.model).proxyObj;
        }

        this.__ATTRDATAS__ = attrDatas;

        this.beforeRender();

        if (this.template && this.template.length) {
            this.templateParserHandler = new TemplateParser(this.template, this, true);
        }

        this.render();

        if (root) {
            if (root instanceof NodeInfo) {
                if (root instanceof ComponentNodeInfo) {
                    //做层级挂载
                    root.childrens = this.templateParserHandler?.nodes;

                    this.nodes?.forEach((node) => {
                        node.parent = root;
                    });
                } else {
                    throw new Error("非法挂载组件，子组件必须挂载到ComponentNodeInfo的节点中");
                }
            }
            this.templateParserHandler?.mount(root);

            this.root = root;

            this.mounted(root);
        }

        return this;
    }

    /**
     * 组件销毁事件（对外）
     */
    public ComponentDispose() {
        for (let name in this.mixins) {
            this.mixins[name].ComponentDispose();
        }

        this.__watchersForValue__.forEach((w) => {
            w.dispose();
        });

        this.templateParserHandler?.dispose();

        this.__nodeChangeListener__.length = 0;

        this.dispose();
    }
    //#endregion

    //#region 默认扩展指令
    public Text(str: string) {
        return str;
    }

    public Html(str: string) {
        return str;
    }
    //#endregion
}

export type ComponentItemType = new (...args: any[]) => Component;
/**
 * 全局组件集合
 */
let GlobalComponents: { [key: string]: ComponentItemType } = {};

/**
 * 注册全局组件
 * @param components 组件
 */
export function registerComponent(components: { [key: string]: ComponentItemType }): void {
    for (let name in components) {
        GlobalComponents[name] = components[name];
    }
}

/**
 * 根据注册key获取组件
 * @param name 组件名称
 * @returns 组件
 */
export function getComponentByName(key: string): ComponentItemType | undefined {
    return GlobalComponents[key];
}
