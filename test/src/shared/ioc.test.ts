import { IContainer } from "@joker/shared";

const id: symbol = Symbol("sss");

interface ITest {
    a: string;
}

class TestClass {
    public handler: ITest = IContainer.get(id);
}

class TestInject implements ITest {
    public a: string = "1";
}

function mainTest() {
    IContainer.bind(id).to(TestInject);

    let ob = new TestClass();

    return ob.handler.a === "1";
}

test("ioc 依赖注入测试", () => {
    expect(mainTest()).toBe(true);
});
