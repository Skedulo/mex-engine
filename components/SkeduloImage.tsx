import React, {useState} from 'react'
import {View, ActivityIndicator} from "react-native";
import ThemesManager from "../mex/colors/ThemeManager";
import AssetsManager from "../mex/assets/AssetsManager";
import FastImage from 'react-native-fast-image';
import {SkedImageProps} from "@skedulo/mex-engine-proxy";

const SkeduloImage = (props: SkedImageProps) => {

    let [isLoading, setIsLoading] = useState(true)
    let [accessToken, setAccessToken] = useState('')

    let colors = ThemesManager.getColorSet()

    AssetsManager.getAccessToken()
        .then((accessToken) => {
            setAccessToken(accessToken)
        })

    let onLoadStart = function() {
        setIsLoading(true)
    }

    let onLoadEnd = function() {
        setIsLoading(false)
    }

    let onError = function() {
        setIsLoading(false)
    }

    return (<View style={[
        {justifyContent: 'center', alignItems: 'center'},
        props.style
    ]}>
        {accessToken.length > 0 ? (<FastImage
                source={{
                    uri: props.uri,
                    headers: {
                        Authorization: 'Bearer ' + accessToken
                    }
                }}
                style={[props.imageStyles ?? {}, {
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    backgroundColor: colors.skedBlue50,
                    opacity: isLoading ? 0.0 : 1.0,
                }]}
                resizeMode={props.resizeMode ?? "cover"}
                onLoadStart={onLoadStart}
                onLoadEnd={onLoadEnd}
                onError={onError}
            />) : null}
            {isLoading
                ? <ActivityIndicator
                    style={{position: "absolute"}}
                    color={colors.skedBlue900} size="small" />
                : null}
    </View>)
}

export default SkeduloImage
