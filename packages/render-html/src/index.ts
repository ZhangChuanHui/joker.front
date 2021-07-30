import {
    CommentNodeInfo,
    ComponentNodeInfo,
    ElementNodeInfo,
    HtmlNodeInfo,
    IRender,
    NodeInfo,
    NodeType,
    TextNodeInfo
} from "@joker/core";

export class RenderHtml implements IRender {
    public elements: DocumentFragment;

    constructor() {
        this.elements = document.createDocumentFragment();
    }

    //#region 接口实现

    public mount(root: Element | NodeInfo): void {
        if (root instanceof Element) {
            root.appendChild(this.elements);
        } else if (root instanceof ComponentNodeInfo && root.el) {
            if (root.parent && root.nodeType === NodeType.COMMANDGROUP) {
                let nodeEl = root.el;
                let parentEl = nodeEl.parentNode;

                //不会出现没有parentEl的场景
                if (parentEl) {
                    parentEl.insertBefore(this.elements, nodeEl);
                }
            } else {
                throw new Error("Render-Html:mount子组件只能挂载到ComponentNodeInfo类型的Node中,或node无父节点");
            }
        } else {
            throw new Error("Render-Html:mount只支持挂载到Element或NodeInfo类型数据中");
        }
    }

    public appendNode(node: NodeInfo): void {
        this.renderNode(node);
        if (node.el) {
            let nodes = node.el instanceof HTMLCollection || Array.isArray(node.el) ? Array.from(node.el) : [node.el];

            for (let item of nodes) {
                this.appendNodeChildren(item, node.parent);
            }

            return;
        }

        throw new Error("未找自身节点的el属性，无法进行dom挂载");
    }

    public updateNode(node: NodeInfo): void {
        switch (node.nodeType) {
            case NodeType.ELEMENT:
                for (let attrName in (<ElementNodeInfo>node).attrs) {
                    let attrVal = (<ElementNodeInfo>node).attrs[attrName];

                    this.setAttribute(node.el, attrName, attrVal);
                }
                break;
            case NodeType.TEXT:
                (node.el as Text).textContent = (<TextNodeInfo>node).text;
                break;
            case NodeType.HTML:
                this.removeNode(node);

                this.appendNode(node);

                break;
            default:
                throw new Error(`NodeType:${node.nodeType}不支持更新`);
        }
    }

    public removeNode(node: NodeInfo): void {
        let nodes = node.el instanceof HTMLCollection || Array.isArray(node.el) ? Array.from(node.el) : [node.el];

        nodes.forEach((item) => {
            item.remove();
        });

        //如果是命令集合则销毁子集
        if (node.nodeType === NodeType.COMMANDGROUP && node.childrens) {
            node.childrens.forEach((c) => {
                this.removeNode(c);
            });
        }
    }
    //#endregion

    //#region 私有实现
    private renderNode(node: NodeInfo): void {
        switch (node.nodeType) {
            case NodeType.TEXT:
                node.el = document.createTextNode((<TextNodeInfo>node).text);
                break;
            case NodeType.HTML:
                let htmlCollection = this.parserHtml((<HtmlNodeInfo>node).html);

                node.el = htmlCollection;
                break;
            case NodeType.ELEMENT:
                let element = document.createElement((<ElementNodeInfo>node).tagName as string);

                for (let attrName in (<ElementNodeInfo>node).attrs || {}) {
                    this.setAttribute(element, attrName, (<ElementNodeInfo>node).attrs[attrName]);
                }

                node.el = element;

                this.initElementEvents(element, <ElementNodeInfo>node);

                break;
            case NodeType.COMMENT:
                node.el = document.createComment((<CommentNodeInfo>node).content);

                break;
            case NodeType.COMMANDGROUP:
                node.el = document.createTextNode("");
                break;
            default:
                throw new Error(`nodeType:${node.nodeType}不支持输出，请检查。`);
        }
    }

    private initElementEvents(el: HTMLElement, node: ElementNodeInfo) {
        node.events.forEach((event) => {
            let eventCallBack = function (e: Event) {
                /**
                 * self : 必须是本身
                 * prevent : 阻止系统
                 * stop : 阻止冒泡
                 * once : 只触发一次
                 */

                if (event.decorates?.includes("self")) {
                    if (e.target !== el) return;
                }

                event.callBack(e);

                if (event.decorates?.length) {
                    if (event.decorates.includes("prevent")) {
                        e.preventDefault();
                    }

                    if (event.decorates.includes("stop")) {
                        e.stopPropagation();
                    }

                    if (event.decorates.includes("once")) {
                        el.removeEventListener(event.name, eventCallBack);
                    }
                }
            };
            el.addEventListener(event.name, eventCallBack);
        });
    }

    private parserHtml(str: string): HTMLCollection {
        var tempContainer = document.createElement("div");

        tempContainer.innerHTML = str;
        return tempContainer.children;
    }

    private appendNodeChildren(element: Element, parent?: NodeInfo) {
        if (parent) {
            switch (parent.nodeType) {
                case NodeType.COMMANDGROUP:
                    let nodeEl = parent.el;
                    let parentEl = nodeEl.parentNode;

                    //不会出现没有parentEl的场景
                    if (parentEl) {
                        parentEl.insertBefore(element, nodeEl);
                    }

                    break;
                case NodeType.ELEMENT:
                    (parent.el as Element).appendChild(element);
                    break;
                default:
                    throw new Error(`NodeType:${parent.nodeType}不支持嵌套子集，请检查`);
            }
        } else {
            this.elements.appendChild(element);
        }
    }

    private setAttribute(el: Element, attrName: string, attrVal: any) {
        if (attrVal instanceof Boolean) {
            //如果是boolean，则做新增和删除特性处理
            if (attrVal) {
                el.setAttribute(attrName, "");
            } else {
                el.removeAttribute(attrName);
            }
        } else {
            el.setAttribute(attrName, (attrVal ?? "").toString());
        }
    }
    //#endregion
}
