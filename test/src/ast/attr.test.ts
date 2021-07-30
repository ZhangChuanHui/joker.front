import { analyAttribute } from "@joker/ast/src/dynamic/attr";
const TAG = "AST解析-";

function attrTest() {
    let attr = analyAttribute("attr", "value");

    let attr1 = analyAttribute("attr", "hh@ss");

    let attr2 = analyAttribute("attr", "sds @(ss+'1'+parseInt('1')+xx(d))tag");

    let attr3 = analyAttribute("attr", "@(1)@(2) (1)");

    let attr4 = analyAttribute("attr", "sss @test(123) '1)' d");
    return (
        attr.str === "value" &&
        !attr.expressValue &&
        attr1.expressValue === '"hh"+context.ss' &&
        attr2.expressValue ===
            "\"sds \"+(context.ss+'1'+parseInt('1')+context.xx(context.d))+\"tag\"" &&
        attr3.expressValue === '(1)+(2)+" (1)"' &&
        attr4.expressValue === '"sss "+context.test(123)+" \'1)\' d"'
    );
}

test(TAG + "属性解析", () => {
    expect(attrTest()).toBe(true);
});
