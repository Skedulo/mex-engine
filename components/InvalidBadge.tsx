import * as React from "react";
import {Text, View, ViewStyle} from "react-native";
import ThemeManager from "../mex/colors/ThemeManager";
import {translate} from "../mex/assets/LocalizationManager";
import StylesManager from "../mex/StylesManager";
import {observer} from "mobx-react";
import {FC} from "react";

type Props = {
    style?: ViewStyle,
    dataContext: any
} | undefined


const InvalidBadge: React.FC<Props> = observer<FC<Props>>((props: Props) => {

    let colors = ThemeManager.getColorSet();
    let styles = StylesManager.getStyles()
    let styleConsts = StylesManager.getStyleConst()

    const defaultProps:Props = {
        style: {},
        dataContext: null
    }

    let translatedProps = { ...defaultProps, ...(props ?? {}) }

    if (!translatedProps.dataContext || !translatedProps.dataContext.__invalid) {
        return null
    }

    return (
        <View style={{ alignItems: 'baseline' }}>
            <View style={{
                marginTop: styleConsts.betweenTextSpacing,
                padding: 8,
                backgroundColor: colors.navy75,
                borderRadius: 5,
                alignContent: "flex-start",
                ...translatedProps.style}}>
                <Text style={[ styles.textMedium, {alignSelf: "center", alignContent: "center", textTransform: "uppercase", fontSize: 14}]}>
                    {translate("builtin_invalid")}
                </Text>
            </View>
        </View>)
})

export default InvalidBadge
