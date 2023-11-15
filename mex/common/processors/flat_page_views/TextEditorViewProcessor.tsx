import {Platform, TextInput, TextInputProps, TextStyle} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions, {DataExpression} from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {runInAction} from "mobx";
import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import ThemeManager from "../../../colors/ThemeManager";
import {ReadonlyText} from "../../../../components/ReadonlyText";
import {TextEditorViewComponentModel} from "@skedulo/mex-types";
import {PageProcessorContext, PageProcessorContextObj} from "../../../hooks/useCrudOnPage";
import {TextEditorView} from "../../../../components/Editors/TextEditorView";

type TextEditorViewProps = EditorViewProps<TextEditorViewArgs, TextEditorViewComponentModel>

type TextEditorViewArgs = EditorViewArgs<TextEditorViewComponentModel> & {}

export default class TextEditorViewProcessor extends AbstractEditorViewProcessor<TextEditorViewProps, TextEditorViewArgs, TextEditorViewComponentModel> {

    getTypeName(): string {
        return "textEditor";
    }

    getAdditionalProperties(args: TextEditorViewArgs) : TextInputProps {
        let jsonDef = args.jsonDef

        let value: TextInputProps = {}

        if (jsonDef.placeholder) {
            value.placeholder = Expressions.getValueFromLocalizedKey({expressionStr: jsonDef.placeholder, dataContext: args.dataContext}) as string // We only allow simple, therefore it won't be a Promise
        }

        if (jsonDef.editable) {
            value.editable = jsonDef.editable;
        }

        if (jsonDef.keyboardType) {
            value.keyboardType = jsonDef.keyboardType
        }

        if (jsonDef.multiline) {
            value.multiline = jsonDef.multiline
        }

        return value
    }

    generateEditorComponent(args: TextEditorViewArgs): JSX.Element {

        const inputRef = useRef<TextInput | null>(null);

        let pageContext = useContext<PageProcessorContextObj|undefined>(PageProcessorContext)

        let readonly = this.isComponentReadonly(args.jsonDef.readonly, args.dataContext)

        useEffect(() => {

            /* Don't focus when readonly */
            pageContext?.focusableControls.push({
                canFocus: !readonly,
                requestFocus: () => {
                    inputRef.current?.focus()
                },
                key: inputRef.current,
            })

            return () => {
                let index = pageContext?.focusableControls.findIndex(item => item.key === inputRef.current);

                if (index !== -1) {
                    pageContext?.focusableControls.slice(index, 1)
                }
            }
        },[readonly]);

        let textDataExpression = new DataExpression({dataContext: args.dataContext, expressionStr: args.jsonDef.valueExpression})

        let [forceRenderFlag, forceRender] = useState(false)

        let handleTextChange = useCallback((newText: string) => {
            runInAction(() => {
                let value: string|Number|null = newText

                if (!newText || newText === "") {
                    textDataExpression.setValue(null)
                    return
                }

                if (newText.endsWith(".") && newText.split(".").length == 2) {
                    // User try to input a decimal => ignore
                    textDataExpression.setValue(value)
                    return
                }

                if (value != null && args.jsonDef.keyboardType === 'number-pad') {
                    let valueNumber = Number(newText)

                    if (isNaN(valueNumber) || !Number.isFinite(valueNumber) || valueNumber.toString() != newText) {
                        let previousValue = textDataExpression.getValue()

                        textDataExpression.setValue(previousValue)

                        if (previousValue === null || previousValue === undefined) {
                            forceRender(!forceRenderFlag)
                        }

                        return
                    }

                    value = valueNumber
                }

                textDataExpression.setValue(value)
            })
        }, [forceRenderFlag])

        const s = StylesManager.getStyles();

        let value = textDataExpression.getValue()?.toString() ?? ""

        if (readonly) {
            /* Read only field */
            return (<ReadonlyText  text={value} />)
        }

        return (<TextEditorView
            ref={inputRef}
            textInputProps={{
                onChangeText:newText => handleTextChange(newText),
                onSubmitEditing:() => {
                    pageContext?.actions.controlRequestOutFocus(inputRef.current)
                },
                ...this.getAdditionalProperties(args)
            }}
            value={value}
            hasError={args.hasError}
        />)
    }
}
