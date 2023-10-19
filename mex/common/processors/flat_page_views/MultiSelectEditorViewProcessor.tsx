import * as React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import Expressions from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {runInAction} from "mobx";
import * as RootNavigation from "../../RootNavigation";
import NavigationProcessManager from "../../NavigationProcessManager";
import {translateOneLevelOfExpression} from "../../InternalUtils";
import utils from "../../Utils";
import ThemeManager from "../../../colors/ThemeManager";
import SkedIcon, {IconTypes} from "../../../../components/SkedIcon";
import StylesManager from "../../../StylesManager";
import {ReadonlyText} from "../../../../components/ReadonlyText";
import {MultiSelectEditorViewComponentModel, SelectPageConfig} from "@skedulo/mex-types";
import {SelectScreenName} from "../../screens/select/SelectScreen";

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
        let displayString = ""
        let selectPageJsonDef = jsonDef.selectPage;

        let fetchStructureExpressionObj = { dataContext: dataContext, expressionStr: jsonDef.structureExpression };

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
        selectedContextObj = structureContextObj.map((item:any) => {
            return Expressions.getValueExpression({
                expressionStr: jsonDef.displayDataInSearchPageExpression,
                dataContext: {...dataContext, item}
            })
        })

        let handleOnFocus = () => {

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

            RootNavigation.navigate(routeName, {selectedData: selectedContextObj, jsonDef: selectPageConfig, dataContext})

            NavigationProcessManager.addTrack(routeName)
                .then(result => {
                    runInAction(() => {
                        if(jsonDef.constructResultObject && result?.length > 0) {
                            let transformData = result.map((item:any) => {
                                const translatedItemData = translateOneLevelOfExpression({
                                    jsonDef: jsonDef.constructResultObject.data,
                                    dataContext: {...dataContext, item}
                                });

                                const existItem = structureContextObj.find((it:any) =>
                                    it.ShowCaseObjectId === translatedItemData[jsonDef.constructResultObject.compareProperty]);

                                if (existItem) return existItem;

                                return {
                                    ...translatedItemData,
                                    __typename: jsonDef.constructResultObject.objectName,
                                    UID: utils.data.generateUniqSerial()
                                }
                            });

                            Expressions.setDataValueExpression(fetchStructureExpressionObj, transformData.length > 0 ? transformData : null)
                        } else {
                            Expressions.setDataValueExpression(fetchStructureExpressionObj, null)
                        }
                    })
                });
        }

        if (readonly) {
            /* Read only field */
            return (<ReadonlyText iconRight={IconTypes.DownArrow} text={displayString} />)
        }

        return (
            <Pressable onPress={handleOnFocus}>
                <View pointerEvents="none">
                    <View style={[StylesManager.getStyles().selector, componentStyles.inputContainer, { borderColor: hasError ? ThemeManager.getColorSet().red800 : ThemeManager.getColorSet().navy100}]}>
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
