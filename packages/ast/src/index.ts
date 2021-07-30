import { ASTAttribute } from "./dynamic/attr";
import { ASTEvent } from "./dynamic/event";

export type AST = {
    [key: string]: any;
    type: ASTNODETYPE;
    childrens?: Array<AST>;
    tagName?: string;
    attrs?: Array<ASTAttribute>;
    events?: Array<ASTEvent>;
    data?: any;
};

export enum ASTNODETYPE {
    ELEMENT,
    COMMAND,
    TEXT,
    COMMENT
}

export { createElement } from "./element";

export { createCommand, COMMANDGROUPKEYS, createCodeFunction } from "./command";

export { createText } from "./text";

export { createComment } from "./comment";

export { createFuntionBody, EXPRESSHANDLERTAG } from "./dynamic/express";

export { ASTEvent } from "./dynamic/event";
