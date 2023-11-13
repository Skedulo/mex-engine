import React, {useCallback} from 'react'
import {ListPageComponentModel} from "@skedulo/mex-types";
import NavigationProcessManager, {NavigationContext} from "../../mex/common/NavigationProcessManager";
import {Animated, Pressable, View} from "react-native";
import ThemeManager from "../../mex/colors/ThemeManager";

type ChildComponentProps = {
    childContentComponent: React.FC<any>,
    jsonDef: ListPageComponentModel,
    dataContext: any,
    navigationContext: NavigationContext
}

export const ListPageChildComponent: React.FC<ChildComponentProps> = (props) => {

    let { jsonDef, dataContext } = props

    const onItemPress = useCallback(() => {
        if (!props.jsonDef.itemClickDestination)
            return

        let pageData = props.dataContext.item

        let navigationContext = new NavigationContext()

        navigationContext.sourceExpression = jsonDef.sourceExpression
        navigationContext.prevPageNavigationContext = props.navigationContext

        return NavigationProcessManager.navigate(
            jsonDef.itemClickDestination,
            pageData,
            navigationContext,
            dataContext)
    }, [props.dataContext])

    const animated = new Animated.Value(1);

    const fadeIn = () => {
        Animated.timing(animated, {
            toValue: 0.4,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };
    const fadeOut = () => {
        Animated.timing(animated, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View
            style={{ opacity: animated, backgroundColor: ThemeManager.getColorSet().white }}>
            <Pressable
                onPressIn={fadeIn}
                onPress={onItemPress}
                disabled={!jsonDef.itemClickDestination}
                onPressOut={fadeOut}>
                <View>
                    <props.childContentComponent args={{
                        listPageJsonDef: jsonDef,
                        jsonDef: jsonDef.itemLayout,
                        dataContext: props.dataContext
                    }}/>
                </View>
            </Pressable>
        </Animated.View>
    )
}
