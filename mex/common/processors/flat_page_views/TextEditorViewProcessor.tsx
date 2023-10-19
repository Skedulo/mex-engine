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

    getStyles({jsonDef, hasError = false}: TextEditorViewArgs, isFocus: boolean, height: number) : TextStyle {
        let value: TextStyle = {};
        let colors = ThemeManager.getColorSet()

        value.color = colors.skeduloText

        if (height !== 0) {
            // Not smaller 40 pixels
            value.height = Math.max(height, 40);

            // Not over 200 pixels
            value.height = Math.min(value.height, 200);
        }

        if (jsonDef.multiline) {
            // Limit the field can be expanded
            value.height = undefined
            value.maxHeight = 200
            value.minHeight = 48
            value.lineHeight = 20
            value.paddingTop = Platform.OS === 'android' ? 8 : 12
            value.paddingBottom = Platform.OS === 'android' ? 8 : 12
        }

        value.borderColor = isFocus ? colors.skedBlue800 : colors.navy100

        if (hasError) {
            value.borderColor = colors.red800
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

        let [focus, setFocus] = useState(false)
        let [height, _] = useState(0)

        let handleOnFocus = useCallback(() => {
            setFocus(true)
        }, [])

        let handleOnBlur = useCallback(() => {
            setFocus(false)
        }, [])

        let value = textDataExpression.getValue()?.toString() ?? ""

        if (readonly) {
            /* Read only field */
            return (<ReadonlyText  text={value} />)
        }

        return (<TextInput
            ref={inputRef}
            onFocus={handleOnFocus}
            onBlur={handleOnBlur}
            style={[
                s.editText,
                this.getStyles(args, focus, height)]}
            value={value}
            underlineColorAndroid="transparent"
            onChangeText={newText => handleTextChange(newText)}
            onSubmitEditing={() => {
                pageContext?.actions.controlRequestOutFocus(inputRef.current)
            }}
            placeholderTextColor={ThemeManager.getColorSet().navy300}
            {...this.getAdditionalProperties(args)}
        />)
    }
}
