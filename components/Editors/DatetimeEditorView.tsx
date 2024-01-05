import {Platform, Pressable, StyleSheet, Text, View} from "react-native";
import {ReadonlyText} from "../ReadonlyText";
import ThemeManager from "../../mex/colors/ThemeManager";
import React, { useEffect, useMemo, useRef, useState} from "react";
import StylesManager from "../../mex/StylesManager";
import moment from "moment";
import converters from "../../mex/common/Converters";
import {DatetimeEditorViewProps, IconTypes, TimeZoneType} from "@skedulo/mex-engine-proxy";
import SkedIcon from "../SkedIcon";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {TimezoneType} from "@skedulo/mex-types";
import AssetsManager from "../../mex/assets/AssetsManager";

export const DatetimeEditorView = (props: DatetimeEditorViewProps) => {

    let {
        value,
        readonly,
        timezone,
        mode,
        placeholder,
        hasError,
        onValueChanged,
        minuteInterval
    } = props

    let dateStr = value

    let timezoneType: TimeZoneType = timezone ?? 'none'

    const _isMounted = useRef(true);
    let dateTimePickerMode = mode
    useEffect(() => {
        return () => {
            _isMounted.current = false;
        }
    }, []);

    const [isFocus, setFocus] = useState(false)
    const [localizedDateStr, setLocalizedDateStr] = useState('')

    let dateTimeValue = dateStr && dateTimePickerMode != "time" ? new Date(dateStr) : new Date()

    if (dateStr) {
        if (dateTimePickerMode == "time") {
            let timeValues = dateStr.split(":")
            if (timeValues.length == 3) {
                let [hour, minutes, seconds] = timeValues

                // Remove ticks in case of "Time"
                let dotIndex = seconds.indexOf(".")
                if (dotIndex !== -1) {
                    seconds = seconds.slice(0, dotIndex)
                }

                dateTimeValue.setUTCHours(hour as number, minutes as number, seconds as number)
            } else {
                return (
                    <Text style={[StylesManager.getStyles().errorText]}>
                        Incorrect format for time: ${dateStr}
                    </Text>
                )
            }
        }
    }

    let handleDateChanged = (newDate: Date) => {
        let newDateTimeStr: string

        if (dateTimePickerMode == "datetime") {
            // format selected date time to the same format with backend
            newDateTimeStr = moment.utc(newDate).toISOString(false)
        } else {
            // format to normal datetime format to easily spit to date & time
            newDateTimeStr = moment.utc(newDate).toISOString(false)

            let splitDateTime = newDateTimeStr.split("T")
            if (splitDateTime.length > 1) {
                if (dateTimePickerMode == "date") {
                    newDateTimeStr = splitDateTime[0]
                } else if (dateTimePickerMode == "time") {
                    newDateTimeStr = splitDateTime[1].slice(0, 8)
                }
            }
        }

        onValueChanged(newDateTimeStr)
    }

    let handleOnFocus = () => {
        setFocus(true)
    }

    let handleOnBlur = () => {
        setFocus(false)
    }

    let
        convertPromise: Promise<string | undefined>
    if (dateTimePickerMode == "date") {
        convertPromise = converters.date.dateFormat(dateStr)
    } else if (dateTimePickerMode == "time") {
        convertPromise = converters.date.timeFormat(dateStr)
    } else {
        convertPromise = converters.date.dateTimeFormat(dateStr, timezoneType)
    }
    convertPromise.then((result: string | undefined) => {
        if (_isMounted.current) {
            if (!result) return;

            if (localizedDateStr !== result) {
                setLocalizedDateStr(result)
            }
        }
    });


    let displayMode: 'default' | 'inline' | 'spinner' = "default"

    if (Platform.OS === 'ios') {
        if (dateTimePickerMode === "time") {
            displayMode = "spinner"
        } else {
            displayMode = "inline"
        }
    }

    const getBorderColor = () => {
        if (hasError) {
            return ThemeManager.getColorSet().red800
        }
        if (isFocus) {
            return ThemeManager.getColorSet().skedBlue800
        }
        return ThemeManager.getColorSet().navy100
    }

    let timezoneOffsetByMinutes = useMemo(() => {
        if (dateTimePickerMode == "datetime" && timezoneType != "none") {
            let timezoneId = getTimezoneId(timezoneType)

            if (timezoneId) {
                return getOffset(timezoneId);
            }
        }

        return 0
    }, [])

    if (readonly) {
        /* Read only field */
        return (<ReadonlyText iconLeft={IconTypes.DatePicker} iconRight={IconTypes.DownArrow} text={localizedDateStr}/>)
    }

    if ([5, 10, 15, 20, 30].includes(minuteInterval) == false) {
        // We do support only these value now
        minuteInterval = undefined
    }

    return (
        <>
            <Pressable onPress={handleOnFocus}>
                <View pointerEvents="none">
                    <View
                        style={[StylesManager.getStyles().selector, componentStyles.inputContainer, {borderColor: getBorderColor()}]}>
                        <SkedIcon style={{marginRight: 8, height: 20, width: 20}} iconType={IconTypes.DatePicker}/>
                        <Text
                            style={[
                                StylesManager.getStyles().textRegular,
                                {
                                    color: localizedDateStr ? ThemeManager.getColorSet().skeduloText : ThemeManager.getColorSet().skeduloPlaceholder,
                                    flex: 1
                                }
                            ]}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                        >
                            {!!localizedDateStr ? localizedDateStr : placeholder }
                        </Text>
                        <SkedIcon style={{marginLeft: 4, height: 10, width: 10}} iconType={IconTypes.DownArrow}/>
                    </View>
                </View>
            </Pressable>

            <DateTimePickerModal
                timeZoneOffsetInMinutes={timezoneOffsetByMinutes}
                minuteInterval={minuteInterval}
                isVisible={isFocus}
                mode={mode}
                date={dateTimeValue}
                onConfirm={(date) => {
                    handleOnBlur()
                    handleDateChanged(date)
                }}
                onCancel={() => {
                    handleOnBlur()
                }}
                display={displayMode}
            />
        </>
    )
}

const getOffset = (timeZone: string): number => {
    const timeZoneName = Intl.DateTimeFormat("ia", {
        timeZoneName: "short",
        timeZone,
    })?.formatToParts()?.find((i) => i.type === "timeZoneName")?.value;

    if (!timeZoneName) return 0;

    const offset = timeZoneName.slice(3);
    if (!offset) return 0;

    const matchData = offset.match(/([+-])(\d+)(?::(\d+))?/);
    if (!matchData) throw `cannot parse timezone name: ${timeZoneName}`;

    const [, sign, hour, minute] = matchData;
    let result = parseInt(hour) * 60;
    if (sign === "-") result *= -1;
    if (minute) result += parseInt(minute);

    return result;
}

const getTimezoneId = (timezoneType: TimezoneType): string | undefined => {
    let timezoneId: string | undefined = undefined

    if (timezoneType == "job") {
        timezoneId = AssetsManager.getMetadata().timezones?.job
    } else if (timezoneType == "local") {
        timezoneId = AssetsManager.getMetadata().timezones?.local
    }

    return timezoneId;
}

const componentStyles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
})
