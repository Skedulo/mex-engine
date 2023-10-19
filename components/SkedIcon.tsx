import {Image, Platform} from "react-native";
import VectorDrawable from "@klarna/react-native-vector-drawable";
import React from "react";

export type SkedIconDef = {
    ios: string,
    android: string
}


export const IconTypes: {
    ChevronRight: SkedIconDef,
    BackArrow: SkedIconDef,
    Cross: SkedIconDef,
    DownArrow: SkedIconDef,
    DatePicker: SkedIconDef,
} = {
    ChevronRight: {
        ios: "ChevronRight",
        android: "ic_cell_chevron_right_2"
    },
    BackArrow: {
        ios: "Back",
        android: "ic_arrow_back"
    },
    Cross: {
        ios: "cross",
        android: "ic_cross_white"
    },
    DownArrow: {
        ios: "arrow_down",
        android: "ic_arrow_down"
    },
    DatePicker: {
        ios: 'datepicker',
        android: 'ic_date_gray',
    }
}

export interface SkedIconProps {
    iconType: SkedIconDef,
    style: any
}

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
