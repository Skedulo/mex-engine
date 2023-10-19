import AbstractFlatPageViewProcessor, {FlatPageViewArgs, FlatPageViewProps} from "./AbstractFlatPageViewProcessor";
import StylesManager from "../../../StylesManager";
import {Text, TouchableOpacity, View} from "react-native";
import MexAsyncText from "../../../../components/MexAsyncText";
import Expressions from "../../expression/Expressions";
import * as React from "react";
import SkedIcon, {IconTypes} from "../../../../components/SkedIcon";
import Divider from "../../../../components/Divider";
import {FC, useCallback} from "react";
import NavigationProcessManager, {NavigationContext} from "../../NavigationProcessManager";
import { observer } from "mobx-react";
import ThemeManager from "../../../colors/ThemeManager";
import {MenuListItem, MenuListViewComponentModel} from "@skedulo/mex-types";


type MenuListViewProps = FlatPageViewProps<MenuListViewArgs, MenuListViewComponentModel>

type MenuListViewArgs = FlatPageViewArgs<MenuListViewComponentModel> & {
    showDivider: boolean
}


export default class MenuListViewProcessor extends AbstractFlatPageViewProcessor<MenuListViewProps,
    MenuListViewArgs,
    MenuListViewComponentModel> {

    generateInnerComponent(args: MenuListViewArgs): JSX.Element {
        let {jsonDef, dataContext} = args

        let showIfValue = super.checkVisibility(args)

        if (!showIfValue) {
            return (<></>)
        }

        const onItemPress = useCallback((itemJsonDef: MenuListItem) => {
            if (!itemJsonDef.itemClickDestination)
                return

            let navigationContext = new NavigationContext()

            navigationContext.prevPageNavigationContext = args.navigationContext

            return NavigationProcessManager.navigate(
                itemJsonDef.itemClickDestination,
                undefined,
                navigationContext,
                dataContext)
        }, [dataContext])

        const renderItem = (itemDef: MenuListItem, index: number): JSX.Element => {
            return (<MenuListItemView
                key={index}
                jsonDef={itemDef}
                onItemPress={onItemPress} dataContext={dataContext}  />)
        }

        return (
            <View>
                {jsonDef.items.map(renderItem)}
            </View>);
    }

    override useObservable() {
        return true;
    }

    override isFullWidthLayout(): boolean {
        return true
    }

    override hasTopMargin(): boolean {
        return false
    }

    getTypeName(): string {
        return "menuList";
    }
}


interface MenuListItemProp {
    onItemPress: (item: MenuListItem) => void,
    jsonDef: MenuListItem,
    dataContext: any
}

const MenuListItemView = observer<FC<MenuListItemProp>>((props) => {

    let { onItemPress, jsonDef, dataContext } = props

    if (jsonDef.showIfExpression) {
        let showIf = Expressions.getValueExpression({
            expressionStr: jsonDef.showIfExpression,
            dataContext: dataContext
        })

        if (!showIf)
            return <></>
    }

    if (jsonDef.badgeText) {
        // Scan through badge text to observe badge text changes
        Expressions.scanValueFromDollarSignExpression({ expressionStr: jsonDef.badgeText, dataContext: dataContext });
    }

    let styles = StylesManager.getStyles()
    let styleConst = StylesManager.getStyleConst()
    let colors = ThemeManager.getColorSet()

    return (<TouchableOpacity
        onPress={() => onItemPress(jsonDef)}
        disabled={!jsonDef.itemClickDestination}>
        <View>
            <View style={{
                flexDirection: "row",
                marginVertical: styleConst.defaultVerticalPadding,
                marginHorizontal: styleConst.defaultHorizontalPadding
            }}>
                <View style={{
                    flexDirection: "column",
                    justifyContent: 'center',
                    flex: 1
                }}>
                    <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                        expressionStr: jsonDef.text,
                        dataContext: dataContext
                    })}>
                        {(text) => text ? (
                            <Text
                                style={[styles.textMedium]}>{text}</Text>) : null}
                    </MexAsyncText>

                    {jsonDef.caption ? <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                        expressionStr: jsonDef.caption,
                        dataContext: dataContext
                    })}>
                        {(text) => text ? (
                            <Text
                                style={[styles.textCaption]}>{text}</Text>) : null}
                    </MexAsyncText> : null}
                </View>

                <View style={{
                    flexDirection: "row"
                }}>
                    {jsonDef.badgeText ? <View style={{
                        height: 30,
                        minWidth: 30,
                        maxWidth: 100,
                        borderRadius: 15,
                        backgroundColor: colors.navy600,
                        paddingHorizontal: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                            expressionStr: jsonDef.badgeText,
                            dataContext: dataContext
                        })}>
                            {(text) => text ? (
                                <Text
                                    numberOfLines={1}
                                    style={[styles.caption, { color: colors.white, flexWrap: "wrap" }]}>
                                    {text}
                                </Text>) : null}
                        </MexAsyncText>
                    </View> : null}

                    <SkedIcon style={{
                        alignSelf: "center",
                        marginLeft: styleConst.betweenTextSpacing,
                        height: 10,
                        width: 6
                    }} iconType={IconTypes.ChevronRight}/>
                </View>
            </View>

            <Divider style={{
                marginHorizontal: styleConst.defaultHorizontalPadding
            }}/>
        </View>
    </TouchableOpacity>)
})
