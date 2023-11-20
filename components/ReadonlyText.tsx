import {StyleSheet, Text, View} from "react-native";
import React from "react";
import SkedIcon from "./SkedIcon";
import ThemeManager from "../mex/colors/ThemeManager";
import {SkedIconDef} from "@skedulo/mex-engine-proxy";

type Props = {
    text: string,
    iconLeft?: SkedIconDef
    iconRight?: SkedIconDef
}

export const ReadonlyText = ({ text, iconLeft, iconRight }: Props) => {
    return (
        <View style={componentStyles.readonlySelector}>
            <View style={componentStyles.rowContainer}>
                {iconLeft && (<SkedIcon style={{ marginRight: 8, height: 20, width: 20 }} iconType={iconLeft}/>)}

                <Text style={componentStyles.readonlyText}>{text}</Text>
            </View>

            {iconRight && (<SkedIcon style={{ marginLeft: 4, height: 10, width: 10 }} iconType={iconRight}/>)}
        </View>
    )
}

const componentStyles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
    },
    readonlySelector: {
        borderWidth: 1,
        borderRadius: 2,
        marginTop: 8,
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: ThemeManager.getColorSet().navy50,
        borderColor: ThemeManager.getColorSet().navy100,
    },
    readonlyText: {
        fontWeight: "normal",
        fontSize: 16,
        flexWrap: 'wrap',
        color: ThemeManager.getColorSet().navy300
    },
})
