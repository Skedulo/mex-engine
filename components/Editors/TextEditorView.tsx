import {Platform, TextInput, TextInputProps, TextStyle} from "react-native";
import {ReadonlyText} from "../ReadonlyText";
import ThemeManager from "../../mex/colors/ThemeManager";
import React, {ForwardedRef, useCallback, useState} from "react";
import StylesManager from "../../mex/StylesManager";
import {TextEditorViewProps} from "@skedulo/mex-engine-proxy";

export const TextEditorView = React.forwardRef((props: TextEditorViewProps, inputRef: ForwardedRef<any>) => {

    let { textInputProps, value, hasError, multiline } = props
    let [focus, setFocus] = useState(false)
    let [height, _] = useState(0)

    const getStyles = useCallback((height: number) : TextStyle => {
        let textStyle: TextStyle = {};
        let colors = ThemeManager.getColorSet()

        textStyle.color = colors.skeduloText

        if (height !== 0) {
            // Not smaller 40 pixels
            textStyle.height = Math.max(height, 40);

            // Not over 200 pixels
            textStyle.height = Math.min(textStyle.height, 200);
        }

        if (multiline) {
            // Limit the field can be expanded
            textStyle.height = undefined
            textStyle.maxHeight = 200
            textStyle.minHeight = 48
            textStyle.lineHeight = 20
            textStyle.paddingTop = Platform.OS === 'android' ? 8 : 12
            textStyle.paddingBottom = Platform.OS === 'android' ? 8 : 12
        }

        textStyle.borderColor = focus ? colors.skedBlue800 : colors.navy100

        if (hasError) {
            textStyle.borderColor = colors.red800
        }

        return textStyle
    }, [focus, height, hasError])

    let handleOnFocus = useCallback(() => {
        setFocus(true)
    }, [])

    let handleOnBlur = useCallback(() => {
        setFocus(false)
    }, [])

    const s = StylesManager.getStyles();

    if (props.readonly) {
        /* Read only field */
        return (<ReadonlyText  text={value} />)
    }

    return (<TextInput
        ref={inputRef}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        style={[
            s.editText,
            getStyles(height)]}
        value={value}
        underlineColorAndroid="transparent"
        placeholderTextColor={ThemeManager.getColorSet().navy300}
        {...textInputProps}
    />)
})
