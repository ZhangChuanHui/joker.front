import { Component } from "../component";
import { NodeInfo, NodeType } from "./parser";

export type NodeEvent = {
    [key: string]: any;
    /**
     * 参数
     */
    data?: any;
    /**
     * 触发事件目标元素 any|NodeInfo
     */
    target: any;
    /**
     * 阻止默认事件
     */
    preventDefault(): void;
    /**
     * 阻止事件传播
     */
    stopPropagation(): void;
};

//#region 扩展类型

export class TextNodeInfo extends NodeInfo {
    constructor(public text: string, public parent?: NodeInfo) {
        super(NodeType.TEXT, parent);
    }
}

export class HtmlNodeInfo extends NodeInfo {
    constructor(public html: string, public parent?: NodeInfo) {
        super(NodeType.HTML, parent);
    }
}

export class CommentNodeInfo extends NodeInfo {
    constructor(public content: string, parent?: NodeInfo) {
        super(NodeType.COMMENT, parent);
    }
}

export class ElementNodeInfo extends NodeInfo {
    public attrs: { [key: string]: string } = {};

    public events: Array<{
        name: string;
        decorates?: Array<string>;
        callBack: (e: NodeEvent) => void;
    }> = [];

    constructor(public tagName: string, parent?: NodeInfo) {
        super(NodeType.ELEMENT, parent);
    }
}

export class ComponentNodeInfo extends NodeInfo {
    public component?: Component;

    public events: Array<{ name: string; decorates?: Array<string>; callBack: (e: NodeEvent) => void }> = [];

    public attrs: { [key: string]: any } = {};

    constructor(parent?: NodeInfo) {
        super(NodeType.COMMANDGROUP, parent);
    }
}

export class ListNodeInfo extends NodeInfo {
    public childrens: Array<NodeInfo> = [];

    constructor(parent?: NodeInfo) {
        super(NodeType.COMMANDGROUP, parent);
    }
}

export class ListItemNodeInfo extends NodeInfo {
    constructor(parent?: NodeInfo) {
        super(NodeType.COMMANDGROUP, parent);
    }
}

export class ConditionNodeInfo extends NodeInfo {
    public condition: boolean = false;

    constructor(parent?: NodeInfo) {
        super(NodeType.COMMANDGROUP, parent);
    }
}

export class RenderSectionNodeInfo extends NodeInfo {
    constructor(public id: string, parent?: NodeInfo) {
        super(NodeType.COMMANDGROUP, parent);
    }
}

//#endregion
