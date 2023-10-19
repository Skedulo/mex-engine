import React from 'react'
import BouncyCheckbox from "react-native-bouncy-checkbox";
import ThemeManager from "../mex/colors/ThemeManager";
import {Platform} from "react-native";
import StylesManager from "../mex/StylesManager";

export const CheckBox = ({ readonly = false, isChecked, handleOnPress, disableText, textComponent } : {
    readonly?: Boolean
    isChecked: Boolean
    handleOnPress: () => void
    disableText?: Boolean
    textComponent?: React.ReactNode
}) => {
    const styles =  StylesManager.getStyles()
    const colors = ThemeManager.getColorSet()

    const getCheckBoxBorderColor = () => {
        if (readonly) {
            return colors.navy100
        }
        return isChecked ? ThemeManager.getColorSet().skedBlue800 : ThemeManager.getColorSet().navy300
    }

    return (
        <BouncyCheckbox
            bounceEffectIn={readonly ? 1 : 0.9}
            isChecked={isChecked}
            innerIconStyle={{
                borderRadius: Platform.OS === 'ios' ? 13 : 5,
                borderColor: getCheckBoxBorderColor()
            }}
            onPress={handleOnPress}
            fillColor={readonly ? colors.navy100 : colors.skedBlue800}
            disableText={disableText}
            textComponent={textComponent}
            {...styles.checkBoxProps}
        />
    )
}
