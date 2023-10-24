import * as React from "react";
import {ColorValue, View, ViewStyle} from "react-native";
import ThemeManager from "../mex/colors/ThemeManager";
import {DividerProps} from "@skedulo/mex-engine-proxy";

const Divider: React.FC<DividerProps> = (props: DividerProps = undefined) => {

    let colors = ThemeManager.getColorSet();

    const defaultProps:DividerProps = {
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
