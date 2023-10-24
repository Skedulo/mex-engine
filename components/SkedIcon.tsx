import {Image, Platform} from "react-native";
import VectorDrawable from "@klarna/react-native-vector-drawable";
import React from "react";
import {SkedIconProps} from "@skedulo/mex-engine-proxy";

const SkedIcon = ({iconType, style}: SkedIconProps) => {

    let iconName:string

    if (Platform.OS == 'ios'){
        iconName = iconType.ios
    } else {
        iconName = iconType.android
    }

    if (Platform.OS === "ios") {
        return (<Image
            resizeMode="contain"
            style={style}
            source={{uri: iconName}}/>)
    } else {
        // Probably Android
        return (<VectorDrawable
            style={{ ...style, resizeMode: 'contain' }}
            resourceName={iconName}/>)
    }
}

export default SkedIcon
