import { matchUtils, arrayUtils, stringUtils, objectUtils, idUtils } from "@joker/shared";

function matchTest() {
    let result = matchUtils.recursive("'('+123+F(456+'(7)'+\"(8)\"9,10)(23)", "(...)");
    let error1 = false,
        error2 = false;
    try {
        matchUtils.recursive("('('+123+F(456+'(7)'+\"(8)\"9,10)(23)", "(...)");
    } catch {
        error1 = true;
    }

    try {
        matchUtils.recursive("'('+123+F(456+'(7)'+\"(8)\"9,10)(23))", "(...)");
        error2 = true;
    } catch {
        error2 = false;
    }
    return (
        error1 &&
        error2 &&
        result.length == 2 &&
        result[0].index === 9 &&
        result[0].value === "(456+'(7)'+\"(8)\"9,10)" &&
        result[1].index === 30 &&
        result[1].value === "(23)"
    );
}

function arrayTest() {
    let arr = [1, 2, 3, "2"];
    let wArr = arrayUtils.without(arr, 2);

    return wArr.length === 3 && arr.length === 3;
}

function stringTest() {
    let emptyTestStr = "                             ",
        trimTestStr = "   s     ";

    return (
        stringUtils.isEmpty(emptyTestStr) &&
        stringUtils.trimStart(trimTestStr) === "s     " &&
        stringUtils.trimEnd(trimTestStr) === "   s" &&
        stringUtils.trimAll(trimTestStr) === "s"
    );
}

function objectTest() {
    let testObj = [1, 2, 3],
        obj = { a: 1, b: 2, c: 3 },
        empObj = {},
        cObj = Object.create(obj);
    let cloneObj = objectUtils.clone(obj);
    return (
        objectUtils.isEmpty(empObj) &&
        objectUtils.isObject(testObj) &&
        objectUtils.isObject(obj) &&
        objectUtils.hasProto(empObj) &&
        !objectUtils.hasOwn(cObj, "c") &&
        JSON.stringify(obj) === JSON.stringify(cloneObj) &&
        objectUtils.isPlainObject(cObj)
    );
}

test("shared项目-Utils-匹配方法", () => {
    expect(matchTest()).toBe(true);
    expect(stringTest()).toBe(true);
    expect(objectTest()).toBe(true);
    expect(arrayTest()).toBe(true);
});
