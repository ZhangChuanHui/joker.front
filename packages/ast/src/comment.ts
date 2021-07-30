import { AST, ASTNODETYPE } from ".";

export function createComment(content: string): AST {
    return {
        type: ASTNODETYPE.COMMENT,
        data: content
    };
}
