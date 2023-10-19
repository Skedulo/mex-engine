import React, {useState} from "react";
import {Text, TouchableWithoutFeedback, View} from "react-native";
import ThemeManager from "../mex/colors/ThemeManager";
import StylesManager from "../mex/StylesManager";
import {PromiseFn} from "react-async";
import MexAsyncText from "./MexAsyncText";
import {SkedButtonTheme} from "@skedulo/mex-types";

export enum SkedButtonSize {
    SMALL = 'small',
    LARGE = 'large',
}

type Props = {
    textPromiseFn: PromiseFn<string>
    onPress?: (() => void) | undefined;
    theme?: SkedButtonTheme,
    disabled?: boolean | undefined
    size?: SkedButtonSize
}

const buttonStyleConfig = {
    primary: {
        backgroundColor: ThemeManager.getColorSet().skedBlue800,
        pressedBackgroundColor: ThemeManager.getColorSet().skedBlue900,
        disabledBackgroundColor: ThemeManager.getColorSet().skedBlue200,
        textColor: ThemeManager.getColorSet().white,
        disabledTextColor: ThemeManager.getColorSet().white,
    },
    success: {
        backgroundColor: ThemeManager.getColorSet().green800,
        pressedBackgroundColor: ThemeManager.getColorSet().green900,
        disabledBackgroundColor: ThemeManager.getColorSet().green200,
        textColor: ThemeManager.getColorSet().white,
        disabledTextColor: ThemeManager.getColorSet().white,
    },
    default: {
        backgroundColor: ThemeManager.getColorSet().navy50,
        pressedBackgroundColor: ThemeManager.getColorSet().navy100,
        disabledBackgroundColor: ThemeManager.getColorSet().navy50,
        textColor: ThemeManager.getColorSet().skeduloText,
        disabledTextColor: ThemeManager.getColorSet().navy300,
    }
}

const SkedButton: React.FC<Props> = ({textPromiseFn, onPress, disabled = false, theme, size }: Props) => {
    const buttonTheme = theme || 'success'
    const buttonSize = size || SkedButtonSize.LARGE
    const [isPressing, setIsPressing] = useState(false)

    const styles = StylesManager.getStyles()

    const onButtonPressed = () => {
        onButtonPressedOut()
        onPress?.()
    }
    const onButtonFocused = () => {
        setIsPressing(true)
    }

    const onButtonPressedOut = () => {
        setIsPressing(false)
    }

    const getBackgroundColor = () => {
        if (disabled) {
            return buttonStyleConfig[buttonTheme].disabledBackgroundColor
        }
        if (isPressing) {
            return buttonStyleConfig[buttonTheme].pressedBackgroundColor
        }
        return buttonStyleConfig[buttonTheme].backgroundColor
    }

    return (
        <TouchableWithoutFeedback
            testID="sked-button"
            disabled={disabled}
            onPressOut={onButtonPressedOut}
            onPressIn={onButtonFocused}
            onPress={onButtonPressed}>
            <View
                style={[buttonSize === SkedButtonSize.SMALL ? styles.buttonSmall : styles.button, {backgroundColor: getBackgroundColor()}]}>
                <MexAsyncText promiseFn={textPromiseFn}>
                    {(text) =>
                        <Text style={[buttonSize === SkedButtonSize.SMALL ? styles.buttonSmallInsideText : styles.buttonInsideText,
                            {color:  disabled ? buttonStyleConfig[buttonTheme].disabledTextColor : buttonStyleConfig[buttonTheme].textColor}]}>{text}</Text>
                    }
                </MexAsyncText>
            </View>
        </TouchableWithoutFeedback>)
}

export default SkedButton
