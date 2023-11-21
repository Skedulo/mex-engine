import * as React from "react";
import Expressions from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {runInAction} from "mobx";
import {useEffect, useRef} from "react";
import {DateTimePickerViewComponentModel} from "@skedulo/mex-types";
import {DatetimeEditorView} from "../../../../components/Editors/DatetimeEditorView";

type DateTimeEditorViewProps = EditorViewProps<DateTimeEditorViewArgs, DateTimePickerViewComponentModel>

type DateTimeEditorViewArgs = EditorViewArgs<DateTimePickerViewComponentModel> & {
}

export default class DateTimeEditorViewProcessor extends AbstractEditorViewProcessor<
    DateTimeEditorViewProps,
    DateTimeEditorViewArgs,
    DateTimePickerViewComponentModel> {

    getTypeName(): string {
        return "dateTimeEditor";
    }

    generateEditorComponent(args: DateTimeEditorViewArgs): JSX.Element {
        let { jsonDef, dataContext } = args

        const _isMounted = useRef(true);

        useEffect(() => {
            return () => {
                _isMounted.current = false;
            }
        }, []);

        let expressionObj = {dataContext: args.dataContext, expressionStr: args.jsonDef.valueExpression};
        let dateStr = Expressions.getValueExpression(expressionObj);

        const readonly = this.isComponentReadonly(args.jsonDef.readonly, args.dataContext)

        let handleDateChanged = (newValue: string) => {
            runInAction(() => {
                Expressions.setDataValueExpression(expressionObj, newValue)
            })

            if(jsonDef.editorEvents?.onValueChanged){
                Expressions.runFunctionExpression({functionExpression: jsonDef.editorEvents!.onValueChanged!, dataContext: {...dataContext, item: newValue} })
            }
        }

        return (
            <DatetimeEditorView
                value={dateStr}
                mode={args.jsonDef.mode}
                hasError={args.hasError}
                readonly={readonly}
                timezone={jsonDef.datetimeOptions?.timezone}
                placeholder={Expressions.getValueFromLocalizedKey({expressionStr: args.jsonDef.placeholder, dataContext: args.dataContext}) as string}
                onValueChanged={handleDateChanged} />
        )
    }
}
