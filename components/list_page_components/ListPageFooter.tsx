import React from 'react'
import {ListPageComponentModel} from "@skedulo/mex-types";
import StylesManager from "../../mex/StylesManager";
import ThemeManager from "../../mex/colors/ThemeManager";
import Expressions from "../../mex/common/expression/Expressions";
import {Text, View} from "react-native";
import MexAsyncText from "../MexAsyncText";

type ListPageFooterComponentProps = {
    jsonDef: ListPageComponentModel,
    dataContext: any,
}

export const ListPageFooterComponent : React.FC<ListPageFooterComponentProps> = (props) => {

    let elements: React.ReactElement[] = [];

    const { jsonDef, dataContext } = props
    const styleCons = StylesManager.getStyleConst()
    const colors = ThemeManager.getColorSet()

    if (jsonDef.footerText) {

        const getFooterText = async (): Promise<string> => {
            let getAddButtonText = Expressions.getValueFromLocalizedKey({
                expressionStr: jsonDef.footerText as string,
                dataContext: dataContext
            })

            if (getAddButtonText instanceof Promise) {
                return await getAddButtonText
            }

            return getAddButtonText;
        }

        elements.push((
            <View key={"footerText"} style={{
                paddingTop: styleCons.defaultVerticalPadding,
                paddingHorizontal: styleCons.defaultVerticalPadding,
                backgroundColor: colors.white
            }}>
                <MexAsyncText key="footerText" promiseFn={getFooterText}>
                    {(text) =>
                        <Text style={[StylesManager.getStyles().textRegular]}>{text}</Text>
                    }
                </MexAsyncText>
            </View>
        ))
    }

    return (<>{elements}</>)
}
