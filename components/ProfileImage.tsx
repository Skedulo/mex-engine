import {Image, StyleProp, Text, View, ViewStyle} from "react-native";
import * as React from "react";
import ThemeManager from "../mex/colors/ThemeManager";
import {useState} from "react";
import StylesManager from "../mex/StylesManager";

const ProfileImage = ({name, url, style}: {
    name?: string,
    url?: string,
    style?: StyleProp<ViewStyle>
}) => {
    let styles = StylesManager.getStyles()
    let colors = ThemeManager.getColorSet()

    const [isImageLoaded, setIsImageLoaded] = useState(false);

    let nameAbbreviations = name?.match(/(\b\S)?/g)?.join("").match(/(^\S|\S$)?/g)?.join("").toUpperCase() ?? ""

    return (
        <View style={style}>
            {url
                ? <Image
                    style={{opacity: isImageLoaded ? 1 : 0, width: "100%", height: "100%", position: "absolute"}}
                    source={{uri: url}}
                    onLoad={() => setIsImageLoaded(true)}/>
                : null}

            {name
                ? <View
                    style={{
                        opacity: !isImageLoaded ? 1 : 0,
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backgroundColor: colors.navy900,
                        justifyContent: "center"
                    }}>
                    <Text style={[
                        styles.textHeadingBold,
                        {
                            textAlign: "center",
                            alignSelf: "center",
                            color: colors.white
                        }]}>{nameAbbreviations}</Text>
                </View>
                : null}

        </View>
    )
}

export default ProfileImage;
