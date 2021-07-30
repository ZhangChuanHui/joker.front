import { AST, ASTNODETYPE, createCodeFunction } from ".";
import { transformDynamic } from "./dynamic/express";

export function createText(text: string): AST {
    let dynaimcValue = transformDynamic(text);

    if (dynaimcValue) {
        return createCodeFunction(dynaimcValue);
    } else {
        return {
            type: ASTNODETYPE.TEXT,
            data: text
        };
    }
}
