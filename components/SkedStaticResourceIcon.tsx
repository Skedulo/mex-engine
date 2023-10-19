import {ActivityIndicator, Image, ImageStyle, StyleProp} from "react-native";
import React, {useState} from "react";
import ThemeManager from "../mex/colors/ThemeManager";
import RNFS from "react-native-fs";
import AssetsManager from "../mex/assets/AssetsManager";

export type SkedStaticResourceIconProps = {
    icon: string,
    style?: StyleProp<ImageStyle> | undefined;
}

const SkedStaticResourceIcon = ({icon, style}: SkedStaticResourceIconProps) => {

    let colors = ThemeManager.getColorSet();

    let filePath = `${RNFS.DocumentDirectoryPath}/mex/resources/${AssetsManager.cachedStaticResourcesId}/images/${icon}`

    let [isLoading, setIsLoading] = useState<boolean>(true)
    let [exists, setExists] = useState<boolean>(true)

    if (isLoading) {
        RNFS.exists(filePath)
            .then((result) => {
                setIsLoading(false)
                setExists(result)
            });

        return (<ActivityIndicator
            style={{position: "absolute"}}
            color={colors.skedBlue900}
            size="small" />)
    }

    if (!exists) {
        return null
    }

    return (<Image
        resizeMode="contain"
        style={style}
        source={{uri: filePath}}/>)
}

export default SkedStaticResourceIcon
