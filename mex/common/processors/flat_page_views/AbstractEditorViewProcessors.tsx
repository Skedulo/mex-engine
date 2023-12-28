import {AbstractFlatPageViewProcessor, StandardComponentArgs, StandardComponentProps} from "@skedulo/mex-engine-proxy";
import {Text, View} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import MexAsyncText from "../../../../components/MexAsyncText";
import React, {useContext, useRef, useState} from "react";
import ErrorTextWithRef from "../../../../components/ErrorText";
import ThemeManager from "../../../colors/ThemeManager";
import {FlatContentViewContext} from "../../../../components/CoreUIRenderers/FlatContentViewRenderer";
import {CommonEditorViewComponentModel, DataExpressionType} from "@skedulo/mex-types";
import InternalUtils from "../../InternalUtils";

export type EditorViewProps<
    TComponentArgs extends EditorViewArgs<TComponentDefinitionModel>,
    TComponentDefinitionModel extends CommonEditorViewComponentModel>
    = StandardComponentProps<TComponentArgs, TComponentDefinitionModel>

export type EditorViewArgs<TComponentDefinitionModel extends CommonEditorViewComponentModel> =
    StandardComponentArgs<TComponentDefinitionModel>
    & { hasError: boolean }

abstract class AbstractEditorViewProcessor<
    TComponentProps extends EditorViewProps<TComponentArgs, TComponentDefinitionModel>,
    TComponentArgs extends EditorViewArgs<TComponentDefinitionModel>,
    TComponentDefinitionModel extends CommonEditorViewComponentModel>
    extends AbstractFlatPageViewProcessor<TComponentProps, TComponentArgs, TComponentDefinitionModel> {

    override generateInnerComponent(args: TComponentArgs): JSX.Element {
        const [hasError, setHasError] = useState<boolean>(false)

        let validatedRef = useRef<boolean>(true)

        let editorComponent = this.generateEditorComponent({...args, hasError})

        let showIfValue = super.checkVisibility(args)

        if (!showIfValue) {
            return (<></>)
        }

        let renderValidator = () => {

            if (this.useValidator(args)) {
                return <ErrorTextWithRef onHasErrorChanged={setHasError} ref={validatedRef} dataContext={args.dataContext} jsonDef={args.jsonDef.validator}/>
            } else {
                return (<></>)
            }
        }

        let isMandatoryField = this.isComponentMandatory(args.jsonDef.mandatory, args.dataContext)

        return (
            <View style={{flexDirection: "column"}}>
                {this.useTitle() && args.jsonDef.title !== undefined ?
                    <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                        expressionStr: args.jsonDef.title,
                        dataContext: args.dataContext
                    })}>
                        {(text) => (
                            <Text style={[
                                StylesManager.getStyles().textMedium
                            ]}>
                                {text}{isMandatoryField ? <Text style={[
                                StylesManager.getStyles().textMedium,
                                {color: ThemeManager.getColorSet().red800}
                            ]}> *</Text> : null}
                            </Text>
                        )}
                    </MexAsyncText>
                    : null}

                {editorComponent}
                {renderValidator()}
            </View>)
    }

    abstract generateEditorComponent(args: TComponentArgs): JSX.Element;

    override useObservable() {
        return true;
    }

    useValidator(args: TComponentArgs): boolean {
        return args.jsonDef.validator !== undefined
    }

    useTitle() {
        return true
    }

    isComponentReadonly(readonlyDef: boolean|DataExpressionType|undefined, dataContext: any): boolean {
        let componentReadonly = InternalUtils.data.getBooleanExpressionGenericValue(readonlyDef, dataContext)

        let flatContentViewContext = useContext(FlatContentViewContext)

        if (componentReadonly) {
            /* Always prioritize component readonly first */
            return true
        }

        return (flatContentViewContext?.readonly ?? false);
    }

    isComponentMandatory(mandatoryDef: boolean|DataExpressionType|undefined, dataContext: any): boolean {
        return InternalUtils.data.getBooleanExpressionGenericValue(mandatoryDef, dataContext)
    }
}

export default AbstractEditorViewProcessor
