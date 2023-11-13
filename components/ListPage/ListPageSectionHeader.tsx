import React from 'react'
import StylesManager from "../../mex/StylesManager";
import ThemeManager from "../../mex/colors/ThemeManager";
import {Text, View} from "react-native";
import MexAsyncText from "../MexAsyncText";
import Expressions from "../../mex/common/expression/Expressions";

type ListPageSectionHeaderComponentProps = {
    title: string,
    dataContext: any
}

export const ListPageSectionHeaderComponent : React.FC<ListPageSectionHeaderComponentProps> = (props) => {
    const styleCons = StylesManager.getStyleConst()
    const styles = StylesManager.getStyles()
    const colors = ThemeManager.getColorSet()

    return (<View style={{
        height: 40,
        backgroundColor: colors.white,
        paddingHorizontal: styleCons.defaultHorizontalPadding,
        justifyContent: "center"
    }}>
        <MexAsyncText key="footerText" promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({ expressionStr: props.title, dataContext: props.dataContext})}>
            {(text) =>
                <Text style={[styles.textMedium, {
                    textAlign: "left",
                    justifyContent: "center",
                    color: colors.navy800
                }]}>{text}</Text>
            }
        </MexAsyncText>
    </View>)
}