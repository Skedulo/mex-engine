import React from 'react'
import BouncyCheckbox from "react-native-bouncy-checkbox";
import ThemeManager from "../mex/colors/ThemeManager";
import {Platform, StyleSheet, View} from "react-native";
import StylesManager from "../mex/StylesManager";

export const RadioButton = ({ readonly = false, isChecked, handleOnPress, disableText = true, textComponent } : {
    readonly?: Boolean
    isChecked: Boolean
    handleOnPress: () => void
    disableText?: Boolean
    textComponent?: React.ReactNode
}) => {
    const styles =  StylesManager.getStyles()
    const colors = ThemeManager.getColorSet()

    const getRadioInnerIconStyle = () => {
        if (readonly) {
            return {borderColor: colors.navy100}
        }
        return {borderColor: isChecked ? colors.skedBlue800 : colors.navy300}
    }

    return (
        <BouncyCheckbox
            bounceEffectIn={readonly ? 1 : 0.9}
            isChecked={isChecked}
            onPress={handleOnPress}
            innerIconStyle={getRadioInnerIconStyle()}
            fillColor={ThemeManager.getColorSet().white}
            iconComponent={isChecked ? <View style={[componentStyles.customRadioCheckIcon,
                {backgroundColor: readonly ? colors.navy100 : colors.skedBlue800}]}/> : null}
            disableText={disableText}
            textComponent={textComponent}
            {...styles.checkBoxProps}
        />
    )
}

const componentStyles = StyleSheet.create({
    customRadioCheckIcon: {
        height: Platform.OS === 'ios' ? 18 : 14,
        width: Platform.OS === 'ios' ? 18 : 14,
        borderRadius: Platform.OS === 'ios' ? 9 : 7,
    }
})
