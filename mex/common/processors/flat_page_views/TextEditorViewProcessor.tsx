import {TextInput, TextInputProps, TouchableOpacity, View} from "react-native";
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
import {ReadonlyText} from "../../../../components/ReadonlyText";
import {TextEditorViewComponentModel} from "@skedulo/mex-types";
import {PageProcessorContext, PageProcessorContextObj} from "../../../hooks/useCrudOnPage";
import {TextEditorView} from "../../../../components/Editors/TextEditorView";
import SkedIcon from "../../../../components/SkedIcon";
import {IconTypes} from "@skedulo/mex-engine-proxy";
import StylesManager from "../../../StylesManager";
import NavigationProcessManager from "../../NavigationProcessManager";

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

        const styleConst = StylesManager.getStyleConst()

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


        let value = textDataExpression.getValue()?.toString() ?? ""

        const hasUseFeatures = args.jsonDef.features?.useBarcodeAndQRScanner ?? false;

        const renderRightIconIfPossible = useCallback(() => {
            if (!args.jsonDef.features?.useBarcodeAndQRScanner) {
                return null
            }

            function scanQRBarCode() {
                NavigationProcessManager.navigate("scanQRBarcodeScreen", {})
                    .then((text) => {
                        if (text) {
                            handleTextChange(text)
                        }
                    })
            }

            return (
            <TouchableOpacity
                onPress={scanQRBarCode}
                style={{
                    alignSelf: "center",
                    alignContent: "center",
                    position: "absolute",
                    right: styleConst.betweenTextSpacing,
                }}>
                <SkedIcon iconType={IconTypes.Camera} style={{
                    marginTop: 5,
                    height: 30,
                    width: 30
                }} />
            </TouchableOpacity>)
        }, [])

        if (readonly) {
            /* Read only field */
            return (<ReadonlyText  text={value} />)
        }

        return (
            <View style={{
                flex: 1,
                flexDirection: 'row',
            }}>
                <View style={{flex: 1}}>
                    <TextEditorView
                        ref={inputRef}
                        textInputProps={{
                            style: hasUseFeatures ? { paddingRight: 40 } : undefined,
                            onChangeText:newText => handleTextChange(newText),
                            onSubmitEditing:() => {
                                pageContext?.actions.controlRequestOutFocus(inputRef.current)
                            },
                            ...this.getAdditionalProperties(args)
                        }}
                        value={value}
                        hasError={args.hasError}
                    />
                </View>

                {renderRightIconIfPossible()}
            </View>)
    }
}
