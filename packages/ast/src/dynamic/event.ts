import { stringUtils, arrayUtils } from "@joker/shared";
import { createFuntionBody } from "./express";

export function transformEvent(attrKey: string, attrVal: string) {
    //eventFunctionParams 暂时解析成字符串
    //后面交由表达式转换成表达式字符串

    if (stringUtils.isEmpty(attrKey)) throw new Error("事件名为空");

    let invalidReg = /^(?<functionName>([a-zA-Z_][0-9\._a-zA-Z]*\s*))(\((?<functionParam>(.*))\))?$/;
    if (attrVal && !invalidReg.test(attrVal)) throw new Error("事件参数解析失败：" + attrVal);

    let eventNameSplit = attrKey.split(".");
    // 匹配attrVal带参数的正则
    let result = attrVal.match(invalidReg);

    let eventParam: ASTEvent = {
        eventName: eventNameSplit[0],
        eventFunctionName: "",
        eventDecorates: eventNameSplit.slice(1)
    };

    if (result && result.groups) {
        // 函数名称
        eventParam.eventFunctionName = (result.groups["functionName"] || "").trim();
        // 事件传参
        eventParam.eventFunctionParam = result.groups["functionParam"];

        if (eventParam.eventFunctionParam) {
            eventParam.eventFunctionParam = createFuntionBody(eventParam.eventFunctionParam);
        }
    }
    if (stringUtils.isEmpty(eventParam.eventFunctionName)) {
        throw new Error("事件参数解析失败：" + attrKey + ",未指定执行事件名");
    }
    return eventParam;
}

export type ASTEvent = {
    eventName: string;
    eventDecorates?: Array<string>;
    eventFunctionName: string;
    eventFunctionParam?: string;
};
