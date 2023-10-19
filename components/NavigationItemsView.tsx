import * as React from "react";
import StylesManager from "../mex/StylesManager"
import {TouchableOpacity, View, Image, ImageSourcePropType, Text} from "react-native";

export type NavigationItemsViewProps = {
    items: RightNavigationItem[]
}

export type RightNavigationItem = {
    onClicked: (() => void) | undefined
    iconSource?: (() => ImageSourcePropType)
    text?: string
}

export let NavigationItemsView: React.FC<NavigationItemsViewProps> = (props) => {
    let styles = StylesManager.getStyles()
    const getHitSlop = (numberOfItems: number, itemIndex: number) => {
        if (numberOfItems === 1) { // in case there is only 1 button
            return {left: 20, right: 20, top: 20, bottom: 20}
        }
        if (itemIndex === 0) { // there is more than 1 button, and this is the first button (ltr)
            return {left: 20, right: 4, top: 20, bottom: 20}
        }
        if (itemIndex === numberOfItems - 1) { // the last button (ltr)
            return {left: 4, right: 20, top: 20, bottom: 20}
        }
        return {left: 4, right: 4, top: 20, bottom: 20}
    }

    return (
        <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap'
        }}>
            {props.items.map((item, index) => {
                return (
                    <TouchableOpacity
                        onPress={() => item.onClicked?.()}
                        key={index}
                        hitSlop={getHitSlop(props.items.length, index)}
                        style={{ marginLeft: 8, justifyContent: "center" }}>
                        {item.iconSource === undefined
                            ? (<Text style={{...styles.headerButtonText}}>{item.text}</Text>)
                            : (<Image
                                source={item.iconSource()}
                                style={{height: 25, width: 25}}/>)}
                    </TouchableOpacity>
                )
            })}
        </View>)
}
