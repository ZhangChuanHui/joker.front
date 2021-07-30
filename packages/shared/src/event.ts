import { arrayUtils } from "./utils/arrayUtils";

class EventHandler {
    private eventDatas: { [key: string]: Array<EventDataItem> } = {};

    public on(name: string, callBack: EventCallBackType): void {
        this.eventDatas[name] = this.eventDatas[name] || [];

        this.eventDatas[name].push({
            isOnce: false,
            callBack: callBack
        });
    }

    public once(name: string, callBack: EventCallBackType) {
        this.eventDatas[name] = this.eventDatas[name] || [];

        this.eventDatas[name].push({
            isOnce: true,
            callBack: callBack
        });
    }

    public off(name: string, callBack?: (item: EventDataItem) => boolean) {
        if (callBack) {
            this.eventDatas[name].some((item) => {
                if (item.callBack === callBack) {
                    arrayUtils.without(this.eventDatas[name], item);
                }
            });
        } else {
            delete this.eventDatas[name];
        }
    }

    public async trigger(name: string, param?: any) {
        let delegats = this.eventDatas[name];

        if (delegats && delegats.length) {
            let i = 0,
                isBreak = false,
                time = 0;

            while (delegats[i]) {
                let item = delegats[i];

                let result = await (<Function>item.callBack).call(
                    this,
                    {
                        target: this,
                        stopPropagation: () => (isBreak = true),
                        time: time
                    },
                    param
                );

                if (item.isOnce) {
                    arrayUtils.without(delegats, item);
                } else {
                    i++;
                }

                if (result === false || isBreak) return false;
            }
        }
    }

    public clearEventListening() {
        this.eventDatas = {};
    }
}

type EventCallBackType =
    | ((e: EventCallParam, param?: any) => Boolean | undefined | Promise<Boolean | undefined>)
    | Function;

interface EventCallParam {
    target: EventHandler;
    stopPropagation: Function;
    time: number;
}

interface EventDataItem {
    isOnce: boolean;
    callBack: EventCallBackType;
}

export { EventHandler, EventCallBackType, EventCallParam, EventDataItem };
