import {translate} from "../assets/LocalizationManager";
import {NativeModules} from 'react-native';
import {BaseStructureObject} from "./models/BaseStructureObject";
import moment from "moment";
import AssetsManager from "../assets/AssetsManager";
import {TimeZoneType} from "@skedulo/mex-engine-proxy/dist/src/proxies/utils/models";

let cache = require('js-cache')();

let converters = {
    date: {
        dateFormat: function (value: string , timezoneType?: TimeZoneType): Promise<string|undefined> {
            return getCachedValueOrFromNative(value, "date", timezoneType)
        },

        timeFormat: function (value: string , timezoneType?: TimeZoneType) {
            if (value && value != '') {
                let timeValues = value.split(":")
                let dashes = value.split("-")

                if (dashes.length == 1 && timeValues.length == 3) {
                    let [hour, minutes, seconds] = value.split(":")

                    // Remove ticks in case of "Time"
                    let dotIndex = seconds.indexOf(".")

                    if (dotIndex !== -1) {
                        seconds = seconds.slice(0, dotIndex)
                        value = [hour, minutes, seconds].join(":")
                    }
                }
            }

            return getCachedValueOrFromNative(value, "time", timezoneType)
        },

        dateTimeFormat: function(value: string, timezoneType?: TimeZoneType) {
            return getCachedValueOrFromNative(value, "datetime", timezoneType)
        },

        dateTimeRangeFormat: function(startDateTime:string, endDateTime:string, timezoneType?: TimeZoneType) {
            let timezone = typeof timezoneType == "string" ? timezoneType :  "none"

            if (!startDateTime || !endDateTime) {
                return undefined;
            }
            let jobId = timezone === "job"
                ? AssetsManager.cachedContextId ?? undefined
                : undefined

            return NativeModules.MexMainModule.getLocalizedDateTimeRangeDisplay(startDateTime, endDateTime, timezoneType, jobId)
        },

        durationFormat: function(d1: string, d2: string, _: string): Promise<string> {
            // TODO: This should be implemented from Native side, by another task https://skedulo.atlassian.net/browse/ENG-33287
            let datetime1 = moment(d1)
            let datetime2 = moment(d2)
            let duration = moment.duration(datetime2.diff(datetime1))

            let result = (duration.days() * 24 + duration.hours()) + " hours and " + duration.minutes() + ' minutes'

            return Promise.resolve(result);
        }
    },
    localization: {
        translate: function(key:string): string {
            return translate(key)
        }
    },
    data: {
        isTempUID: function(obj: BaseStructureObject) {
            return obj.__isTempObject ? true : false
        },
        isCreatingNewObject: function(obj: BaseStructureObject) {
            return obj.__isCreatingNewObject ? true : false
        }
    }
}

function getCachedValueOrFromNative(value: string, type: string, timezoneType?: TimeZoneType): Promise<string|undefined> {
    let timezone = typeof timezoneType == "string" ? timezoneType :  "none"
    if (!value) {
        return Promise.resolve(undefined)
    }

    let cacheKey = `converters-datetimeFormat-${value}-${type}-${timezoneType}`;

    let cacheValue = cache.get(cacheKey, null);
    if (cacheValue) {
        return Promise.resolve(cacheValue)
    }
    let jobId = timezone === "job"
        ? AssetsManager.cachedContextId ?? undefined
        : undefined

    let promise = new Promise<string|undefined>(function (resolve, reject) {
        NativeModules.MexMainModule.getLocalizedDateTimeDisplay(value, type, timezone, jobId)
            .then((value:string) => {
                cache.set(cacheKey, value, 30000); // 30 secs

                resolve(value)
            })
            .catch((err:Error) => {
                reject(err)
            })
    })

    cache.set(cacheKey, promise, 30000); // 30 secs

    return promise
}

export default converters
