import { createFuntionBody } from "@joker/ast/src/dynamic/express";
const TAG = "AST解析-";

function expressTest() {
    let body1 = createFuntionBody("a");
    let body2 = createFuntionBody("a+b+'a'");
    let body3 = createFuntionBody("a+b(a,2)");
    let body4 = createFuntionBody("a+parseInt('1')*b.c");
    let body5 = createFuntionBody("a['a'][1][b]+{key:'a'}['key']");

    return (
        body1 === "context.a" &&
        body2 === "context.a+context.b+'a'" &&
        body3 === "context.a+context.b(context.a,2)" &&
        body4 === "context.a+parseInt('1')*context.b.c" &&
        body5 === "context.a['a'][1][context.b]+{key:'a'}['key']"
    );
}

test(TAG + "表达式解析", () => {
    expect(expressTest()).toBe(true);
});
