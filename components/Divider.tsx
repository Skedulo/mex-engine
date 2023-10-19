import * as React from "react";
import {ColorValue, View, ViewStyle} from "react-native";
import ThemeManager from "../mex/colors/ThemeManager";

type Props = {
    color?: ColorValue
    style?: ViewStyle
} | undefined


const Divider: React.FC<Props> = (props: Props = undefined) => {

    let colors = ThemeManager.getColorSet();

    const defaultProps:Props = {
        color: colors.navy75,
        style: {}
    }

    props = { ...defaultProps, ...(props ?? {}) }

    return <View style={{
        width: "100%",
        height: 1,
        backgroundColor: props.color,
        ...props.style}}></View>
}

export default Divider
