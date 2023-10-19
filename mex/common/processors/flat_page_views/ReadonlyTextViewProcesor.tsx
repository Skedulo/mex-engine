import * as React from "react";
import Expressions from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import MexAsyncText from "../../../../components/MexAsyncText";
import {ReadonlyText} from "../../../../components/ReadonlyText";
import {ReadonlyTextViewComponentModel} from "@skedulo/mex-types";

type ReadonlyTextViewProps = EditorViewProps<ReadonlyTextViewArgs, ReadonlyTextViewComponentModel>

type ReadonlyTextViewArgs = EditorViewArgs<ReadonlyTextViewComponentModel> & {
}

export default class ReadonlyTextViewProcessor extends AbstractEditorViewProcessor<ReadonlyTextViewProps, ReadonlyTextViewArgs, ReadonlyTextViewComponentModel> {

    getTypeName(): string {
        return "readonlyTextView";
    }

    generateEditorComponent(args: ReadonlyTextViewArgs): JSX.Element {

        // We need to call this to subscribe the value changed inside this expression, otherwise this method is not capable to subscribe the value change.
        Expressions.scanValueFromDollarSignExpression({dataContext: args.dataContext, expressionStr: args.jsonDef.text})

        return (
            <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                dataContext: args.dataContext,
                expressionStr: args.jsonDef.text
            })}>
                {(text) => (
                    <ReadonlyText text={text} />)}
            </MexAsyncText>)
    }
}
