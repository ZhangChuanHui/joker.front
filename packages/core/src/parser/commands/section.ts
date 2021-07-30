import { AST } from "@joker/ast";
import { SectionType } from "../../component";
import { Observer } from "../../observer/observer";
import { RenderSectionNodeInfo } from "../node";
import { IParser } from "../parser";

export const DEFAULT_SECTION_TAG = "default";

export class ParserRenderSectionCommand extends IParser {
    declare node: RenderSectionNodeInfo;

    public sectionId: string = DEFAULT_SECTION_TAG;

    public sectionParams: Array<any> = [];

    public sectionRenderOb?: any;

    public sectionItem?: SectionType;

    public childrenAsts?: Array<AST>;

    public parser(): void {
        this.transformParam();

        this.node = new RenderSectionNodeInfo(this.sectionId, this.parent);

        this.addSelfNode();

        this.sectionItem = this.ob.sections[this.sectionId];

        if (this.sectionItem && this.sectionItem.render) {
            this.initRenderSectionOb();

            this.childrenAsts = this.sectionItem.render(this.node, this.sectionRenderOb);
        }
    }

    public selfDispose() {
        this.childrenAsts && this.disposeAsts(this.childrenAsts);

        this.childrenAsts = undefined;
    }

    private transformParam(): void {
        try {
            let express = this.runExpressWithWatcher(
                `[${this.ast.data}]`,
                (newVal: Array<any>) => {
                    let newSectionId = newVal[0] || DEFAULT_SECTION_TAG;

                    if (newSectionId !== this.sectionId) {
                        throw new Error("section id 不可动态变更");
                    }

                    this.sectionParams = newVal.slice(1);

                    if (this.sectionRenderOb) {
                        this.updateRenderSectionOb();
                    }
                },
                this.ob
            ) as Array<any>;
            this.sectionId = express[0] || DEFAULT_SECTION_TAG;
            this.sectionParams = express.slice(1);
        } catch {
            throw new Error(`RenderSection参数解析失败，参数：${this.ast.data}`);
        }
    }

    private initRenderSectionOb() {
        this.sectionRenderOb = Object.create(this.sectionItem?.ob);

        if (this.sectionItem?.params?.length) {
            for (let i = 0; i < this.sectionItem.params.length; i++) {
                Observer.defineProperty(this.sectionRenderOb, this.sectionItem.params[i], this.sectionParams[i]);
            }
        }
    }

    private updateRenderSectionOb() {
        if (this.sectionItem?.params?.length) {
            for (let i = 0; i < this.sectionItem.params.length; i++) {
                let key = this.sectionItem.params[i];

                if (this.sectionRenderOb[key] !== this.sectionParams[i]) {
                    this.sectionRenderOb[key] = this.sectionParams[i];
                }
            }
        }
    }
}
