import { stringUtils } from "@joker/shared";
import { NodeChangeType } from "../component";
import { ElementNodeInfo, NodeEvent } from "./node";
import { IParser } from "./parser";

export class ParserElement extends IParser {
    public parser(): void {
        let nodeInfo = new ElementNodeInfo(this.ast.tagName as string, this.parent);

        this.ast.attrs?.forEach((attr) => {
            let attrVal = attr.str;

            if (attr.key === "ref") {
                if (stringUtils.isEmpty(attrVal)) {
                    throw new Error("ref 值不能为空");
                }
                this.addRef(attrVal, nodeInfo);
                return;
            }

            if (attr.expressValue) {
                attrVal = this.runExpressWithWatcher(attr.expressValue, (val: any) => {
                    (<ElementNodeInfo>this.node).attrs[attr.key] = (val ?? "").toString();
                    this.templateParser.Render?.updateNode(<ElementNodeInfo>this.node);

                    this.nodeChangeNotify(NodeChangeType.UPDATE);
                });
            }

            nodeInfo.attrs[attr.key] = (attrVal ?? "").toString();
        });

        this.ast.events?.forEach((event) => {
            let componentCallBack = (<any>this.ob)[event.eventFunctionName];
            if (componentCallBack && typeof componentCallBack === "function") {
                nodeInfo.events.push({
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

        this.node = nodeInfo as ElementNodeInfo;

        this.addSelfNode();

        this.renderChildren();
    }
}
