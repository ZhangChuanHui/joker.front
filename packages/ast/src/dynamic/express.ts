import { matchUtils } from "@joker/shared";

const RE_ALLOWEDKEYWORDS = new RegExp(
    "^(" +
        [
            "Math",
            "Date",
            "this",
            "true",
            "false",
            "null",
            "undefined",
            "Infinity",
            "NaN",
            "isNaN",
            "isFinite",
            "decodeURI",
            "decodeURIComponent",
            "encodeURI",
            "encodeURIComponent",
            "parseInt",
            "parseFloat"
        ].join("\\b|") +
        "\\b)"
);

const NOTALLOWEDKEYWORDS = [
    "break",
    "case",
    "class",
    "catch",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "let",
    "return",
    "super",
    "switch",
    "throw",
    "try",
    "var",
    "while",
    "with",
    "yield",
    "enum",
    "await",
    "implements",
    "package",
    "protected",
    "static",
    "interface",
    "private",
    "public"
];
const RE_NOTALLOWEDKEYWORDS = new RegExp("^(" + NOTALLOWEDKEYWORDS.join("\\b|") + "\\b)");
const RE_STATICVALUE =
    /[\{,]\s*[\w\$_]+\s*:|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`)|new |typeof |void /g;
const RE_STATICTEMPKEY = /"(\d+)"/g;
const RE_PROPERTY_TAG = /[^\w$\.](?:[A-Za-z_$][\w$]*)/g;

export const EXPRESSHANDLERTAG = "context";

export function createFuntionBody(exp: string) {
    if (RE_NOTALLOWEDKEYWORDS.test(exp)) {
        throw new Error("表达式中不得出现关键字:" + NOTALLOWEDKEYWORDS.join(",") + ";exp:" + exp);
    }

    let stateValues: Array<string> = [];

    //表达式，剔除前后空格，不存在空字符串，这里是表达式，不是运行时
    var body = (exp || "")
        .trim()
        .replace(RE_STATICVALUE, (str: string, isString: Boolean) => {
            //将静态值临时存储
            var i = stateValues.length;
            stateValues[i] = isString ? str.replace(/\n/g, "\\n") : str;
            return '"' + i + '"';
        })
        .replace(/\s/g, "");

    body = (" " + body)
        .replace(RE_PROPERTY_TAG, (str: string) => {
            var splitVal = str.charAt(0);
            var path = str.slice(1);
            if (RE_ALLOWEDKEYWORDS.test(path)) {
                return str;
            } else {
                path =
                    path.indexOf('"') > -1
                        ? path.replace(RE_STATICTEMPKEY, (str: string, i: number) => {
                              return stateValues[i];
                          })
                        : path;
                return splitVal + EXPRESSHANDLERTAG + "." + path;
            }
        })
        .replace(RE_STATICTEMPKEY, (str: string, i: number) => {
            return stateValues[i];
        });

    if (body.charAt(0) === " ") body = body.substring(1);

    return body;
}

export function transformDynamic(exporessStr: string): string | undefined {
    let reg = /@(?<express>([a-zA-Z_][\\-\\.0-9a-zA-Z]*(\[.*\])*(\s*\(.*\))*)|(\(.*\)))\s*/;

    if (reg.test(exporessStr)) {
        let expressStrs = [];
        while (exporessStr) {
            let matchResult = exporessStr.match(reg);
            if (matchResult && matchResult.groups && matchResult.index != undefined) {
                let prevText = exporessStr.substring(0, matchResult.index);
                if (prevText) {
                    expressStrs.push(`"${prevText}"`);
                }

                let strExpress = matchResult.groups.express;
                let funcCodeResult = matchUtils.recursive(strExpress, "(...)", false, true);

                if (funcCodeResult.length) {
                    let funcCodeItem = funcCodeResult[0];
                    let strFuncBody = strExpress.substring(0, funcCodeItem.index + funcCodeItem.value.length);
                    expressStrs.push(createFuntionBody(strFuncBody));
                    exporessStr = exporessStr.substring(matchResult.index + 1 + strFuncBody.length);
                } else {
                    expressStrs.push(createFuntionBody(strExpress));
                    exporessStr = exporessStr.substring(matchResult.index + matchResult[0].length);
                }
            } else {
                expressStrs.push(`"${exporessStr}"`);
                exporessStr = "";
            }
        }
        /**
         * 使用运算符+ 进行拼接
         * 不能使用数组的join，因为对于组件的pops ，不一定是字符串
         * 如果字符串中使用+拼接出现问题，应该改数据类型，而不是运算符
         * 例如两个紧邻的运算符使用则会@(1)@(2) 则会编译成1+2
         */
        return expressStrs.join("+");
    }
}
