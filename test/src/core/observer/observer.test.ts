import { Component } from "@joker/core/src/component";
import { Observer } from "@joker/core/src/observer/observer";

class TestView extends Component {
    model = {
        attr1: "v1",
        obj: {
            a: "1"
        }
    };

    test = "2";
}

function mainTest() {
    //检测数据无污染
    let obj1 = new TestView().ComponentInitialize();

    obj1.model.attr1 = "1";
    obj1.model.obj.a = "2";

    let obj2 = new TestView().ComponentInitialize();

    return obj2.model.attr1 === "v1" && obj2.model.obj.a === "1";
}

function ownTest() {
    let obj1 = new TestView().ComponentInitialize();

    let obj2 = Object.create(obj1);

    Observer.defineProperty(obj2, "index", 0);

    if (obj2.index !== 0) return false;

    obj2.index = [1, 2, 3, 4];

    return obj2.index.length === 4;
}

test("next/observer 数据劫持", () => {
    expect(mainTest()).toBe(true);
    expect(ownTest()).toBe(true);
});
