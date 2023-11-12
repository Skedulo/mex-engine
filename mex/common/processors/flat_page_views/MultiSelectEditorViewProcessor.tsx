import React, { useCallback, useState } from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import Expressions from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {runInAction} from "mobx";
import * as RootNavigation from "../../RootNavigation";
import NavigationProcessManager from "../../NavigationProcessManager";
import {translateOneLevelOfExpression} from "../../InternalUtils";
import utils from "../../Utils";
import ThemeManager from "../../../colors/ThemeManager";
import SkedIcon from "../../../../components/SkedIcon";
import StylesManager from "../../../StylesManager";
import {ReadonlyText} from "../../../../components/ReadonlyText";
import {MultiSelectEditorViewComponentModel, SelectPageConfig} from "@skedulo/mex-types";
import {SelectScreenName} from "../../screens/select/SelectScreen";
import {IconTypes} from "@skedulo/mex-engine-proxy";
import {useFocusEffect} from "@react-navigation/native";

type MultiSelectEditorViewProps = EditorViewProps<MultiSelectEditorViewArgs, MultiSelectEditorViewComponentModel>

type MultiSelectEditorViewArgs = EditorViewArgs<MultiSelectEditorViewComponentModel> & {
}

export default class MultiSelectEditorViewProcessor
    extends AbstractEditorViewProcessor<MultiSelectEditorViewProps, MultiSelectEditorViewArgs, MultiSelectEditorViewComponentModel> {

    getTypeName(): string {
        return "multiSelectEditor";
    }

    generateEditorComponent(args: MultiSelectEditorViewArgs): JSX.Element {
        let {jsonDef, dataContext, hasError = false} = args;
        const [isFocused, setIsFocused] = useState(false)
        let displayString = ""
        let selectPageJsonDef = jsonDef.selectPage;

        let fetchStructureExpressionObj = { dataContext: dataContext, expressionStr: jsonDef.structureExpression ?? jsonDef.valueExpression };

        let structureContextObj = Expressions.getValueExpression(fetchStructureExpressionObj) ?? [];

        let selectedContextObj: any = [];

        const readonly = this.isComponentReadonly(args.jsonDef.readonly, args.dataContext)

        displayString = structureContextObj.reduce((result: string, item: any, index: number) => {
            const itemDisplayStr = Expressions.getValueExpression({
                expressionStr: jsonDef.displayExpression,
                dataContext: {...dataContext, item}
            })
            result = result + (index === 0 ? "" : ", ") + itemDisplayStr;
            return result
        }, "");

        selectedContextObj = jsonDef.structureExpression ? structureContextObj.map((item:any) => {
            return Expressions.getValueExpression({
                expressionStr: jsonDef.displayDataInSearchPageExpression,
                dataContext: {...dataContext, item}
            })
        }) : structureContextObj.map((item:any) => {
            return {
                Label: item,
                Value: item
            }
        })

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
                isMultiSelect: true,
                filterExpression: jsonDef.filterExpression,
                onlineSource: jsonDef.onlineSource
            }

            let routeName = SelectScreenName;

            RootNavigation.navigate(routeName, { selectedData: selectedContextObj, jsonDef: selectPageConfig, dataContext })

            NavigationProcessManager.addTrack(routeName)
                .then(result => {
                    runInAction(() => {
                        // the user has chosen some options, we need to handle them
                        if (result?.length > 0) {
                            // the value is an array of objects, we need to
                            if (jsonDef.structureExpression) {
                                if (jsonDef.constructResultObject) {
                                    let transformData = result.map((item: any) => {
                                        const translatedItemData = translateOneLevelOfExpression({
                                            jsonDef: jsonDef.constructResultObject.data,
                                            dataContext: {...dataContext, item}
                                        });

                                        const existItem = structureContextObj.find((it: any) =>
                                            it[jsonDef.constructResultObject.compareProperty] === translatedItemData[jsonDef.constructResultObject.compareProperty]);

                                        if (existItem) return existItem;

                                        return {
                                            ...translatedItemData,
                                            __typename: jsonDef.constructResultObject.objectName,
                                            UID: utils.data.generateUniqSerial()
                                        }
                                    });
                                    Expressions.setDataValueExpression(fetchStructureExpressionObj, transformData.length > 0 ? transformData : null)
                                } else {
                                    Expressions.setDataValueExpression(fetchStructureExpressionObj, result)
                                }
                            } else if (result?.[0]?.Value) {
                                // From vocab
                                const transformData = result.map((item: any) => item.Value)
                                Expressions.setDataValueExpression(fetchStructureExpressionObj, transformData ?? null)
                            } else {
                                // Otherwise, the value we're expecting is just pure value
                                Expressions.setDataValueExpression(fetchStructureExpressionObj, result ?? null)
                            }
                        } else {
                            // the user has not chosen any options, just set data to null
                            Expressions.setDataValueExpression(fetchStructureExpressionObj, null)
                        }
                    })
                }
            )
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

        if (readonly) {
            /* Read only field */
            return (<ReadonlyText iconRight={IconTypes.DownArrow} text={displayString} />)
        }

        return (
            <Pressable onPress={handleOnFocus}>
                <View pointerEvents="none">
                    <View style={[StylesManager.getStyles().selector, componentStyles.inputContainer, { borderColor: getBorderColor() }]}>
                        <Text
                            style={[
                                StylesManager.getStyles().textRegular,
                                { color: displayString ? ThemeManager.getColorSet().skeduloText : ThemeManager.getColorSet().skeduloPlaceholder, flex: 1 }
                            ]}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                        >
                            {!!displayString ? displayString  : Expressions.getValueFromLocalizedKey({expressionStr: jsonDef.placeholder, dataContext: dataContext}) as string}
                        </Text>
                        <SkedIcon style={{ marginLeft: 4, height: 10, width: 10 }} iconType={IconTypes.DownArrow}/>
                    </View>
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
