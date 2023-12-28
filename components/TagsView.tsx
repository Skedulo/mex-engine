import React, {useCallback} from "react";
import {View, Text} from "react-native";
import StylesManager from "../mex/StylesManager";
import MexAsyncText from "./MexAsyncText";
import Expressions from "../mex/common/expression/Expressions";
import ThemeManager from "../mex/colors/ThemeManager";
import {PageLevelDataContext} from "@skedulo/mex-engine-proxy";
import {TagItemModel, TagModel} from "@skedulo/mex-types";

export interface Props {
    dataContext: PageLevelDataContext,
    uiDef: TagModel
}

const TagsView = ({dataContext, uiDef}: Props) => {

    let { items } = uiDef

    let renderTag = useCallback((item: TagItemModel, index: number) => {
        return (<TagView key={index} dataContext={dataContext} item={item} />)
    }, [dataContext])

    return (
        <View style={{
            marginTop: 10,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
        }}>
            {items.map((item, index) => {
                return renderTag(item, index)
            })}
        </View>)
}

const TagView = ({ dataContext, item }: { dataContext: PageLevelDataContext, item: TagItemModel }) => {
    const styles = StylesManager.getStyles()
    const colors = ThemeManager.getColorSet()
    const styleConst = StylesManager.getStyleConst()

    let themeValue = Expressions.getDataFromValueExpression({
        dataContext: dataContext,
        valueDef: item.themeValueExpression
    })

    if (themeValue === "none") {
        return <></>
    }

    let getThemeProperties = useCallback((theme: string): {
        backgroundColor: string,
        borderColor: string,
        textColor: string,
        borderWidth: number
    } => {
        const isAlternativeStyle = themeValue.endsWith('_alt')
        const themeColor = theme.replace('_alt', '')
        switch (themeColor) {
            case "success":
                return {
                    backgroundColor: isAlternativeStyle ? colors.white : colors.successTag,
                    borderColor: isAlternativeStyle ? colors.successTag : colors.white,
                    textColor: isAlternativeStyle ? colors.successTag : colors.white,
                    borderWidth: isAlternativeStyle ? 1 : 0
                }
            case "default":
                return {
                    backgroundColor: isAlternativeStyle ? colors.white : colors.defaultTag,
                    borderColor: isAlternativeStyle ? colors.defaultTag : colors.white,
                    textColor: isAlternativeStyle ? colors.defaultTag : colors.white,
                    borderWidth: isAlternativeStyle ? 1 : 0
                }
            case "primary":
                return {
                    backgroundColor: isAlternativeStyle ? colors.white : colors.primaryTag,
                    borderColor: isAlternativeStyle ? colors.primaryTag : colors.white,
                    textColor: isAlternativeStyle ? colors.primaryTag : colors.white,
                    borderWidth: isAlternativeStyle ? 1 : 0
                }
            case "focus":
                return {
                    backgroundColor: isAlternativeStyle ? colors.white : colors.focusTag,
                    borderColor: isAlternativeStyle ? colors.focusTag : colors.white,
                    textColor: isAlternativeStyle ? colors.focusTag : colors.white,
                    borderWidth: isAlternativeStyle ? 1 : 0
                }
            case "danger":
                return {
                    backgroundColor: isAlternativeStyle ? colors.white : colors.dangerTag,
                    borderColor: isAlternativeStyle ? colors.dangerTag : colors.white,
                    textColor: isAlternativeStyle ? colors.dangerTag : colors.white,
                    borderWidth: isAlternativeStyle ? 1 : 0
                }
            case "warning":
                return {
                    backgroundColor: isAlternativeStyle ? colors.white : colors.warningTag,
                    borderColor: isAlternativeStyle ? colors.warningTag : colors.white,
                    textColor: isAlternativeStyle ? colors.warningTag : colors.white,
                    borderWidth: isAlternativeStyle ? 1 : 0
                }
            default:
                return {
                    backgroundColor: isAlternativeStyle ? colors.white : colors.defaultTag,
                    borderColor: isAlternativeStyle ? colors.defaultTag : colors.white,
                    textColor: isAlternativeStyle ? colors.defaultTag : colors.white,
                    borderWidth: isAlternativeStyle ? 1 : 0
                }
        }
    }, [])

    const { backgroundColor, borderColor, textColor, borderWidth } = getThemeProperties(themeValue);

    return (
        <View
            style={{
                marginRight: styleConst.betweenTextSpacing,
                marginBottom: styleConst.betweenTextSpacing,
                flexDirection: 'row',
                borderRadius: 3,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: borderWidth,
                maxWidth: 200,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                expressionStr: item.text,
                dataContext: dataContext
            })}>
                {(text) => (
                    <Text style={[styles.textCaption, {
                        marginHorizontal: 5,
                        marginVertical: 6,
                        textAlignVertical: "center",
                        color: textColor,
                        textTransform: "uppercase",
                        fontWeight: "600"
                    }]}>{text}</Text>
                )}
            </MexAsyncText>
        </View>)
}

export default TagsView
