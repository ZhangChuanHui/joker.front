export namespace matchUtils {
    function escape(str: string): string {
        return str.replace(/[-[\]{}()*+?.\\^$|,]/g, "\\$&");
    }

    export function recursive(str: string, format: string, isGlobal: boolean = true, excludeStr: boolean = true) {
        // 匹配 ... 两端的分割符号
        let keyParts = /^([\S\s]+?)\.\.\.([\S\s]+)/.exec(format);

        if (keyParts === null || keyParts[1] === keyParts[2])
            // 左右分隔符必须相等
            throw new Error("format必须是 X...X 格式，并且前后关键字不可一致");
        // 左分隔符
        let opener = keyParts[1];
        // 右分隔符
        let closer = keyParts[2];
        // 全局索引左右分割符
        let reg = new RegExp(`[${escape(opener + closer)}]`, "g");
        // 匹配后单引号或双引号中的值
        let regSpecial = /(?<special>((?<=').*?(?='))|((?<=").*?(?=")))/;

        let strSpecial = str;

        let resSpecial: Array<{ start: number; end: number; value: string }> = [];

        let startSpecialIndex = 0;
        while (excludeStr && strSpecial) {
            // 匹配出引号内的部分
            let matchResult = strSpecial.match(regSpecial);
            if (matchResult && matchResult.index !== undefined && matchResult.groups && matchResult.groups.special) {
                // 根据匹配出的位置扩选出整个带引号的部分并存入数组中
                let startIndex = matchResult.index - 1 + startSpecialIndex;
                let endIndex = startIndex + matchResult.groups.special.length + 2;
                resSpecial.push({
                    start: startIndex,
                    end: endIndex,
                    value: str.substring(startIndex, endIndex)
                });
                // 记录最后一个引号起始位置
                startSpecialIndex = endIndex;
                // 截取最后一个引号起始位置到整个字符串结尾
                strSpecial = str.substring(endIndex);
            } else {
                strSpecial = "";
            }
        }

        let results = [],
            openTokens = 0,
            match,
            matchStartIndex = -1;

        //逐个匹配字符串中的左右分隔符
        while ((match = reg.exec(str))) {
            /**
             * 正则的实例属性 lastIndex, 初始情况下都是从零开始，当第二次调用这个实例匹配字符串时是从
             * 上一次匹配完成位置的下一个位置开始。（当然正则实例是开启全局的）
             * 1.如果上次匹配到了一个位置大于等于此次匹配的字符串的长度，那么此次匹配返回false或空数组
             * 2.如果上次没有匹配到，那么此次匹配还是从零开始
             */
            let lastIndex = reg.lastIndex;
            let inSpecialStr = resSpecial.some((item) => {
                // 如果分割符为引号内的则不进行处理
                if (lastIndex > item.start && lastIndex < item.end) return true;
                return false;
            });
            // 引号内分隔符继续下一循环
            if (inSpecialStr) {
                continue;
            }
            // 处理引号外的分隔符
            if (match[0] == opener) {
                // 记录第一个左分割符的起始位置
                if (!openTokens) matchStartIndex = lastIndex;
                // 如果为左分隔符，增加计数器
                openTokens++;
            } else if (openTokens) {
                // 处理右分隔符
                openTokens--;
                if (!openTokens) {
                    // 根据左分隔符位置数出一样个数右分隔符个数，截取两个分隔符之间的字符串
                    let content = str.slice(matchStartIndex - opener.length, match.index + closer.length);
                    results.push({
                        value: content,
                        index: matchStartIndex - opener.length
                    });
                    // 如果不是全局检索，则在处理完第一组分隔符内容后终止循环
                    if (isGlobal === false) {
                        break;
                    }
                }
            }
        }

        // 有不闭合的左分割符
        if (openTokens !== 0 || (matchStartIndex > -1 && results.length === 0)) {
            throw new Error(`闭合标签配错误，请检查闭合标签`);
        }

        return results;
    }
}
