import React, {useCallback} from "react";
import {ListItemTagItemModel, ListItemTagModel} from "@skedulo/mex-types";
import {View, Text} from "react-native";
import StylesManager from "../mex/StylesManager";
import MexAsyncText from "./MexAsyncText";
import Expressions from "../mex/common/expression/Expressions";
import ThemeManager from "../mex/colors/ThemeManager";
import {PageLevelDataContext} from "@skedulo/mex-engine-proxy/dist/proxies/services";

export interface Props {
    dataContext: PageLevelDataContext,
    uiDef: ListItemTagModel
}

const TagsView = ({dataContext, uiDef}: Props) => {

    let { items } = uiDef

    let renderTag = useCallback((item: ListItemTagItemModel, index: number) => {
        return (<TagView key={index}dataContext={dataContext} item={item} />)
    }, [])

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

const TagView = ({ dataContext, item }: { dataContext: PageLevelDataContext, item: ListItemTagItemModel }) => {
    const styles = StylesManager.getStyles()
    const colors = ThemeManager.getColorSet()
    const styleConst = StylesManager.getStyleConst()

    let themeValue = Expressions.getDataFromValueExpression({dataContext: dataContext, valueDef: item.themeValueExpression})

    if (themeValue === "none") {
        return <></>
    }

    let getThemeColor = useCallback((theme: string): {textColor: string, backgroundColor: string} => {
        switch(theme) {
            case "primary":
                return {
                    backgroundColor: colors.skedBlue900,
                    textColor: colors.white
                }
            case "success":
                return {
                    backgroundColor: colors.green900,
                    textColor: colors.white
                }
            case "default":
                return {
                    backgroundColor: colors.navy75,
                    textColor: colors.skeduloText
                }
            default:
                return {
                    backgroundColor: colors.navy75,
                    textColor: colors.skeduloText
                }
        }
    }, [])

    let { backgroundColor, textColor } = getThemeColor(themeValue);

    return (
        <View
            style={{
                marginRight: styleConst.betweenTextSpacing,
                marginBottom: styleConst.betweenTextSpacing,
                flexDirection: 'row',
                borderRadius: 3,
                backgroundColor: backgroundColor,
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
                        textTransform: "uppercase"
                    }]}>{text}</Text>
                )}
            </MexAsyncText>
        </View>)
}

export default TagsView
