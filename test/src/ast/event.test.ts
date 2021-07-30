import { transformEvent } from "@joker/ast/src/dynamic/event";
const TAG = "AST解析-";

function eventTest() {
    let r1 = transformEvent("click", "x");
    let r2 = transformEvent("click.stop.once", "x(a,'1')");
    let r3 = transformEvent("click", "x(a,parseInt('1'))");
    let r4 = transformEvent("click", "x(a,sum(1,2),')')");
    let r5 = transformEvent("click", "x (1)");
    let r6;

    try {
        //解析失败 未闭合
        transformEvent("click", "x(1");
    } catch (error) {
        r6 = false;
    }

    return (
        r1.eventFunctionName === "x" &&
        r2.eventDecorates &&
        r2.eventFunctionParam === "context.a,'1'" &&
        r3.eventFunctionParam === "context.a,parseInt('1')" &&
        r4.eventFunctionParam === "context.a,context.sum(1,2),')'" &&
        r5.eventFunctionName === "x" &&
        r6 === false
    );
}

test(TAG + "事件解析", () => {
    expect(eventTest()).toBe(true);
});
