import { transformDynamic } from "./express";

export function analyAttribute(key: string, str: string): ASTAttribute {
    let result: ASTAttribute = {
        key: key,
        str: str,
        expressValue: transformDynamic(str)
    };

    return result;
}

export type ASTAttribute = {
    key: string;
    str: string;
    expressValue?: string;
};
