import * as React from "react";
import {Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {runInAction} from "mobx";
import * as RootNavigation from "../../RootNavigation";
import NavigationProcessManager from "../../NavigationProcessManager";
import MexAsyncText from "../../../../components/MexAsyncText";
import ThemeManager from "../../../colors/ThemeManager";
import SkedIcon, {IconTypes} from "../../../../components/SkedIcon";
import {translateOneLevelOfExpression} from "../../InternalUtils";
import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {ReadonlyText} from "../../../../components/ReadonlyText";
import {SelectEditorViewComponentModel, SelectPageConfig} from "@skedulo/mex-types";
import {SelectScreenName} from "../../screens/select/SelectScreen";

type SelectEditorViewProps = EditorViewProps<SelectEditorViewArgs, SelectEditorViewComponentModel>

type SelectEditorViewArgs = EditorViewArgs<SelectEditorViewComponentModel> & {
}

export default class SelectEditorViewProcessor
    extends AbstractEditorViewProcessor<SelectEditorViewProps, SelectEditorViewArgs, SelectEditorViewComponentModel> {

    getTypeName(): string {
        return "selectEditor";
    }

    generateEditorComponent(args: SelectEditorViewArgs): JSX.Element {
        let {jsonDef, dataContext, hasError = false} = args;
        const [isFocused, setIsFocused] = useState(false)
        let styles = StylesManager.getStyles()

        let displayString = ""
        let selectPageJsonDef= jsonDef.selectPage;

        let fetchStructureExpressionObj = { dataContext: dataContext, expressionStr: jsonDef.structureExpression ?? jsonDef.valueExpression };
        let fetchValueExpressionObj = { dataContext: dataContext, expressionStr: jsonDef.valueExpression };

        let structureContextObj = Expressions.getValueExpression(fetchStructureExpressionObj);

        displayString = Expressions.getValueExpression({expressionStr: jsonDef.displayExpression, dataContext: {...dataContext}})

        useFocusEffect(useCallback(()=>{
            setIsFocused(false)
        },[]))

        let handleOnFocus = () => {
            setIsFocused(true)

            // Open selection page
            let selectPageConfig:SelectPageConfig = {
                emptyText: selectPageJsonDef.emptyText,
                itemTitle: selectPageJsonDef.itemTitle,
                itemCaption: selectPageJsonDef.itemCaption,
                dataSourceExpression: jsonDef.sourceExpression,
                header: {
                    title: jsonDef.selectPage.title,
                    hasClearBtn: true,
                },
                singleSelectionConfig: {
                    dismissPageAfterChosen: false,
                },
                searchBar: selectPageJsonDef.searchBar,
                filterExpression: jsonDef.filterExpression,
                onlineSource: jsonDef.onlineSource
            }

            let routeName = SelectScreenName;

            RootNavigation.navigate(routeName, {selectedData: structureContextObj, jsonDef: selectPageConfig, dataContext})

            NavigationProcessManager.addTrack(routeName)
                .then(result => {
                    runInAction(() => {
                        if (jsonDef.structureExpression) {
                            // If structure is defined, we need to handle structure
                            if (jsonDef.constructResultObject && result) {

                                let transformData = translateOneLevelOfExpression({
                                    jsonDef: jsonDef.constructResultObject!.data,
                                    dataContext: {...dataContext, item: result}
                                });

                                Expressions.setDataValueExpression(fetchStructureExpressionObj, transformData)
                                Expressions.setDataValueExpression(fetchValueExpressionObj,transformData?.UID ? transformData.UID : null)
                            } else {
                                Expressions.setDataValueExpression(fetchStructureExpressionObj, result ? result : null)
                                Expressions.setDataValueExpression(fetchValueExpressionObj,result ? result.UID : null)
                            }
                        }
                        else if (result?.Value) {
                            // From vocab
                            Expressions.setDataValueExpression(fetchValueExpressionObj, result?.Value ?? null)
                        }
                        else {
                            // Otherwise, the value we're expecting is just pure value
                            Expressions.setDataValueExpression(fetchValueExpressionObj, result ?? null)
                        }
                    })
                });
        }

        const getCaptionStr = async (): Promise<string> => {
            if (!jsonDef.caption) {
                return ""
            }

            let caption = Expressions.getValueFromLocalizedKey({expressionStr: jsonDef.caption, dataContext: dataContext})

            if (caption instanceof Promise) {
                return await caption
            }

            return caption;
        }

        const getBorderColor = () => {
            if (hasError) {
                return ThemeManager.getColorSet().red800
            }
            if (isFocused) {
                return ThemeManager.getColorSet().skedBlue800
            }
            return ThemeManager.getColorSet().navy100
        }

        let isComponentReadonly = this.isComponentReadonly(jsonDef.readonly, dataContext)

        return (
            <Pressable onPress={handleOnFocus} disabled={isComponentReadonly} >
                <View pointerEvents={isComponentReadonly ? "auto" : "none"}>

                    {!isComponentReadonly
                        ? <View style={[StylesManager.getStyles().selector, componentStyles.inputContainer, { borderColor: getBorderColor()}]}>
                            <TextInput
                                editable={false}
                                placeholder={Expressions.getValueFromLocalizedKey({expressionStr: jsonDef.placeholder, dataContext: dataContext}) as string}
                                style={[StylesManager.getStyles().textRegular, { flex: 1 }]}
                                value={displayString}
                                underlineColorAndroid="transparent"
                            />
                            <SkedIcon style={{ marginLeft: 4, height: 10, width: 10 }} iconType={IconTypes.DownArrow}/>
                        </View>
                        : <ReadonlyText iconRight={IconTypes.DownArrow} text={displayString} />
                    }

                    <MexAsyncText promiseFn={getCaptionStr}>
                        {(text) => {
                            return (text.length > 0 ?
                                <Text style={[
                                    styles.textCaptionSelector,
                                    { marginTop: 8 }
                                ]}>{text}</Text> : null)
                        }}
                    </MexAsyncText>
                </View>
            </Pressable>
        )
    }
}

const componentStyles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
});
