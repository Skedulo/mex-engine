import {runInAction} from "mobx";
import moment from "moment";
import { translate } from "../../assets/LocalizationManager";
import {String} from "../String";
import { Alert } from 'react-native'
import {PageProcessorContextObj, PageSubmitOption} from "../../hooks/useCrudOnPage";
import AssetsManager from "../../assets/AssetsManager";
import {
    ExtHelper,
    ExtHelperData,
    ExtHelperDate,
    ExtHelperSubmitOptions,
    ExtHelperUI,
    TimezoneMetadata, TimeZoneType
} from "@skedulo/mex-engine-proxy";
import converters from "../Converters";

export class ExtHelperImpl implements ExtHelper {
    data: ExtHelperData
    date: ExtHelperDate
    ui: ExtHelperUI

    constructor(
        pageProcessorContext?: PageProcessorContextObj
    ) {
        this.data = new ExtHelperDataImpl(pageProcessorContext)
        this.date = new ExtHelperDateImpl()
        this.ui = new ExtHelperUIImpl()
    }
}

class ExtHelperDataImpl implements ExtHelperData {

    pageProcessorContext?: PageProcessorContextObj

    constructor(
        pageProcessorContext?: PageProcessorContextObj
    ) {
        this.pageProcessorContext = pageProcessorContext
    }

    changeData(fn: () => void): any {
        runInAction(fn)
    }

    submit(options?: ExtHelperSubmitOptions): Promise<boolean> {
        return this.pageProcessorContext!.actions.submit(options as PageSubmitOption)
    }

    translate(key: string, args: any[]): string {
        let translatedStr = translate(key)

        if (!args || args.length == 0) {
            return translatedStr
        }

        return String.format(translatedStr, args)
    }

    getTimezonesData(): TimezoneMetadata|undefined {
        return AssetsManager.getMetadata().timezones;
    }
}

class ExtHelperDateImpl implements  ExtHelperDate {
    getNowDateTime(): string {
        return moment.utc(new Date()).toISOString(false)
    }

    getLocaleDateDisplay(value: string, type: "date" | "datetime" | "time", timezone: TimeZoneType): Promise<string|undefined> {
        if (type == "date") {
            return converters.date.dateFormat(value ,timezone)
        } else if (type == "datetime") {
            return converters.date.dateTimeFormat(value ,timezone)
        }

        return converters.date.timeFormat(value, timezone);
    }
}

class ExtHelperUIImpl implements  ExtHelperUI {
    alert(message: string): void {
        return Alert.alert(message)
    }
}
