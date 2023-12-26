import * as React from 'react'
import AbstractPageProcessor, {
    AbstractPageProcessorContextObj,
    StandardPageComponentArgs
} from "./AbstractPageProcessors";
import {Platform, ScrollView, Text, TouchableOpacity, View} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import InternalUtils from "../../InternalUtils";
import SkedButton from "../../../../components/SkedButton";
import SkedIcon from "../../../../components/SkedIcon";
import ThemeManager from "../../../colors/ThemeManager";
import {FirstPageRightNavigationComponent} from "../../../../components/FirstPageRightNavigationComponent";
import AssetsManager from "../../../assets/AssetsManager";
import {
    FlatContentViewRenderer
} from "../../../../components/CoreUIRenderers/FlatContentViewRenderer";
import {FlatPageComponentModel} from "@skedulo/mex-types";
import {
    PageProcessorContext,
    FlatPageRenderResult,
    useCrudOnPage
} from "../../../hooks/useCrudOnPage";
import {IconTypes} from "@skedulo/mex-engine-proxy";

enum FlatPageType {
    Display,
    Insert,
    Update
}

class FlatPageProcessor extends AbstractPageProcessor<FlatPageComponentModel> {

    getTypeName(): string {
        return "flat";
    }

    generateContent(args: StandardPageComponentArgs<FlatPageComponentModel>, abstractPageProcessorContextObj: AbstractPageProcessorContextObj): [JSX.Element, any] {

        let { jsonDef, dataContext} = args

        let {
            pageProcessorContextObj,
            pageContentViewRefFunctions,
            ignoreGoBackCondition,
            finalizeEditingAndBack
        } = useCrudOnPage({
            navigation: args.navigation,
            dataContext: dataContext,
            firstPage: args.firstPage,
            abstractPageProcessorContextObj: abstractPageProcessorContextObj,
            defaultDataForNewObject: args.jsonDef?.upsert?.defaultDataForNewObject,
            navigationContext: args.navigationContext,
            confirmingGoingBack: true,
            allowSaveDraftOnInvalid: !jsonDef.wipeExistingData /* Not allow save draft if the page always want new data every time */,
            alwaysAsNewData: jsonDef.wipeExistingData /* If wipe existing data, meaning the user always try to creat new record everytime */,
            events: {
                onPreDataSave: jsonDef.events?.onPreDataSave
            }
        }) ?? {}

        let additionalData: FlatPageRenderResult = {
            flatPageProcessorContext: pageProcessorContextObj
        }

        let styleConst = StylesManager.getStyleConst()

        let generateDeleteButton = (): JSX.Element|null => {

            let { jsonDef, dataContext } = args

            const onDeleteButtonPressed = async () => {
                let confirm = jsonDef.delete.confirm

                if (!args.navigationContext.sourceExpression)
                    return

                let title:string = '', description:string = '', yesText:string = '', noText:string = '';
                await Promise.all([
                    InternalUtils.data.alwaysTranslateTextIntoPromise(confirm?.title ?? "builtin_confirm_delete_title", dataContext)
                        .then((result:string) => title = result),
                    InternalUtils.data.alwaysTranslateTextIntoPromise(confirm?.description ?? "builtin_confirm_delete_description", dataContext)
                        .then((result:string) => description = result),
                    (confirm?.yesBtn
                        ? InternalUtils.data.alwaysTranslateTextIntoPromise(confirm.yesBtn, dataContext)
                        : InternalUtils.data.alwaysTranslateTextIntoPromise("yes", dataContext))
                        .then((result:string) => yesText = result),
                    (confirm?.noBtn
                        ? InternalUtils.data.alwaysTranslateTextIntoPromise(confirm.noBtn, dataContext)
                        : InternalUtils.data.alwaysTranslateTextIntoPromise("no", dataContext))
                        .then((result:string) => noText = result),
                ])

                let isConfirmed = await InternalUtils.ui.alert({
                    title: title,
                    description: description,
                    yesText: yesText,
                    noText: noText,
                })

                if (!isConfirmed)
                    return

                InternalUtils.data.removeData({
                    dataStructure: dataContext.pageData,
                    destinationDataContext: args.navigationContext.prevPageNavigationContext?.currentDataContext,
                    destinationExpression: args.navigationContext.sourceExpression,
                    compareProperty: "UID"
                })

                if (ignoreGoBackCondition) {
                    ignoreGoBackCondition.current = true;
                }

                await finalizeEditingAndBack?.();
            }

            const getDeleteButton = async (): Promise<string> => {
                let deleteText = Expressions.getValueFromLocalizedKey({expressionStr: jsonDef.delete.text, dataContext: dataContext})

                if (deleteText instanceof Promise) {
                    return await deleteText
                }

                return deleteText;
            }

            if (!jsonDef.delete)
                return null;

            let canDelete = Expressions.getValueExpression({ expressionStr: jsonDef.delete.canDeleteExpression, dataContext })

            if (!canDelete)
                return null;

            return (<SkedButton
                theme="default"
                onPress={onDeleteButtonPressed}
                textPromiseFn={getDeleteButton}/>)
        }

        return [(
            <PageProcessorContext.Provider value={pageProcessorContextObj}>
                <View style={{
                    flex: 1,
                    backgroundColor: ThemeManager.getColorSet().white}}>
                    <ScrollView style={{
                        flex: 1,
                        paddingTop: styleConst.defaultVerticalPadding
                    }}>
                        <View style={{
                            flex: 1,
                            paddingBottom: 40
                        }}>
                            <FlatContentViewRenderer
                                ref={pageContentViewRefFunctions}
                                navigationContext={args.navigationContext}
                                formValidator={jsonDef.upsert?.validator}
                                dataContext={dataContext}
                                items={jsonDef.items}
                                readonly={jsonDef.upsert?.readonly ?? false}
                                header={jsonDef.header}
                            />
                        </View>
                    </ScrollView>

                    <View style={{backgroundColor : ThemeManager.getColorSet().white, padding: styleConst.defaultVerticalPadding, marginHorizontal: styleConst.defaultHorizontalPadding}}>
                        {generateDeleteButton()}
                    </View>
                </View>
            </PageProcessorContext.Provider>), additionalData]
    }

    getNavigationOptions(
        args: StandardPageComponentArgs<FlatPageComponentModel>,
        navigationOptions: any,
        additionalData: FlatPageRenderResult): any {

        let { jsonDef, dataContext } = args;

        let flatPageType = this.getFlatPageType(args)
        let styles = StylesManager.getStyles()

        if (jsonDef.upsert && !AssetsManager.getResources().jsonDef.readonly) {
            let upsertDef = jsonDef.upsert

            if (args.firstPage) {
                // If first page, it's always Save button
                navigationOptions.headerRight = () => { return <FirstPageRightNavigationComponent
                    submit={additionalData?.flatPageProcessorContext?.actions.submit}
                /> }

            } else {
                // If not first page, it's at least second page or third page with upsert action
                navigationOptions.title = flatPageType == FlatPageType.Insert
                    ? Expressions.getValueFromLocalizedKey({
                        expressionStr: upsertDef.insertTitle ?? args.jsonDef.title,
                        dataContext: dataContext
                    })
                    : Expressions.getValueFromLocalizedKey({
                        expressionStr: upsertDef.updateTitle ?? args.jsonDef.title,
                        dataContext: dataContext
                    })

                if (flatPageType === FlatPageType.Insert) {

                    let saveButtonText = Expressions.getValueFromLocalizedKey({
                        expressionStr: upsertDef.insertButtonText,
                        dataContext: dataContext
                    }) as string

                    let submit = () => {
                        additionalData.flatPageProcessorContext?.actions.submitFormWithCondition(true, true)
                    }

                    navigationOptions.headerRight = () => {
                        return (
                            <TouchableOpacity
                                onPress={submit}
                                hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
                            >
                                    <Text style={[styles.headerButtonText]}>{saveButtonText}</Text>
                            </TouchableOpacity>)
                    }
                }
            }
        }

        if (!args.firstPage) {
            if (Platform.OS === "ios") {
                navigationOptions.headerLeft = () => {
                    return (
                        <TouchableOpacity
                            onPress={() => {
                                args.navigation.goBack();
                            }}
                            hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
                            style={{marginRight: 10}}>
                                <SkedIcon style={{height: 24, width: 24, tintColor: ThemeManager.getColorSet().white}} iconType={IconTypes.BackArrow} />
                        </TouchableOpacity>
                    )
                }
            } else {
                // Android doesn't need back button
                navigationOptions.headerLeft = () => { return (<View/>) }
            }
        }

        return navigationOptions;
    }

    getFlatPageType(args: StandardPageComponentArgs<FlatPageComponentModel>) : FlatPageType {
        let { jsonDef, dataContext } = args

        if (!jsonDef.upsert)
            return FlatPageType.Display

        let isInserting = dataContext.pageData.__isCreatingNewObject

        return isInserting ? FlatPageType.Insert : FlatPageType.Update
    }

}

export default FlatPageProcessor;

