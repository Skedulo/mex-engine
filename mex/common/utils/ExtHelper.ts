import {runInAction} from "mobx";
import moment from "moment";
import { translate } from "../../assets/LocalizationManager";
import {String} from "../String";
import { Alert } from 'react-native'
import {PageProcessorContextObj, PageSubmitOption} from "../../hooks/useCrudOnPage";
import AssetsManager, {TimezoneMetadata} from "../../assets/AssetsManager";

export interface ExtHelper {
    data: ExtHelperData
    date: ExtHelperDate
    ui: ExtHelperUI
}

interface ExtHelperData {
    getTimezonesData(): TimezoneMetadata|undefined
    changeData(fn: () => void):any /* Change data in data context */
    submit(options?: ExtHelperSubmitOptions): Promise<boolean> /* Submit/Save data from current page, and automatically close page */
    translate(key: string, args?: any[]): string /* translate key from localization keys */
}

type ExtHelperSubmitOptions = {
    stopWhenInvalid?: Boolean
}

interface ExtHelperDate {
    getNowDateTime(): string /* get current date time */
}

interface ExtHelperUI {
    alert(message: string): void /* make an alert UI */
}

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
}

class ExtHelperUIImpl implements  ExtHelperUI {
    alert(message: string): void {
        return Alert.alert(message)
    }
}
