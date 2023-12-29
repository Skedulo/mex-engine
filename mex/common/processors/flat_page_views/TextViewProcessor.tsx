import React from "react";
import {Text, View} from "react-native";
import Expressions from "../../expression/Expressions";
import MexAsyncText from "../../../../components/MexAsyncText";
import {TextViewComponentModel} from "@skedulo/mex-types";
import {AbstractFlatPageViewProcessor, FlatPageViewArgs} from "@skedulo/mex-engine-proxy";
import {FlatPageViewProps} from "@skedulo/mex-engine-proxy/dist/src/processors/models";
import StylesManager from "../../../StylesManager";

type TextViewProps = FlatPageViewProps<TextViewArgs, TextViewComponentModel>

type TextViewArgs = FlatPageViewArgs<TextViewComponentModel> & {}

export default class TextViewProcessor extends AbstractFlatPageViewProcessor<TextViewProps, TextViewArgs, TextViewComponentModel> {

    override useObservable(): boolean {
        return true
    }
    getTypeName(): string {
        return "textView";
    }

    generateInnerComponent(args: TextViewArgs): JSX.Element {
        const showIfValue = super.checkVisibility(args)
        const {dataContext, jsonDef} = args
        const {title, text} = jsonDef ?? {}

        if (!showIfValue) {
            return (<></>)
        }

        return (
            <View style={{flexDirection: "column"}}>
                {!!title &&
                    <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                        expressionStr: title,
                        dataContext: dataContext
                    })}>
                        {(text) => (
                            <Text style={StylesManager.getStyles().textMedium}>
                                {text}
                            </Text>
                        )}
                    </MexAsyncText>
                }

                <View style={{ height: 8 }} />

                <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                    expressionStr: text,
                    dataContext: dataContext
                })}>
                    {(text) => (
                        <Text style={StylesManager.getStyles().textRegular}>
                            {text}
                        </Text>
                    )}
                </MexAsyncText>
            </View>
        )
    }
}
