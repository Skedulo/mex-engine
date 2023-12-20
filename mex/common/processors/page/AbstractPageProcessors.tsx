import {AbstractProcessor, StandardComponentArgs, StandardComponentProps} from "@skedulo/mex-engine-proxy";
import * as React from "react";
import {useCallback, useEffect, useLayoutEffect, useRef} from "react";
import Expressions from "../../expression/Expressions";
import InternalUtils from "../../InternalUtils";
import {Alert, AlertButton, BackHandler, Platform, TouchableOpacity} from "react-native";
import converters from "../../Converters";
import {translate} from "../../../assets/LocalizationManager";
import AssetsManager from "../../../assets/AssetsManager";
import DraftManager from "../../../assets/DraftManager";
import DataUtils from "../../utils/DataUtils";
import {FirstPageRightNavigationComponent} from "../../../../components/FirstPageRightNavigationComponent";
import {NavigationItemsView, RightNavigationItem} from "../../../../components/NavigationItemsView";
import SkedIcon from "../../../../components/SkedIcon";
import ThemeManager from "../../../colors/ThemeManager";
import { BasePageComponentModel } from "@skedulo/mex-types";
import {IconTypes, PageLevelDataContext} from "@skedulo/mex-engine-proxy";

export type PageComponentProps<TComponentDefinitionModel extends BasePageComponentModel> = StandardComponentProps<StandardPageComponentArgs<TComponentDefinitionModel>, TComponentDefinitionModel>

export type StandardPageComponentArgs<TComponentDefinitionModel extends BasePageComponentModel> =
    StandardComponentArgs<TComponentDefinitionModel>
    & {
    navigation: any,
    firstPage: boolean
}

export type AbstractPageProcessorRefFunctions = {
    submit: () => Promise<boolean>,
}

export class AbstractPageProcessorContextObj {
    constructor(actions: AbstractPageProcessorRefFunctions) {
        this.actions = actions
    }

    actions: AbstractPageProcessorRefFunctions
}

export const AbstractPageProcessorContext = React.createContext<AbstractPageProcessorContextObj | undefined>(undefined)

abstract class AbstractPageProcessor<TComponentDefinitionModel extends BasePageComponentModel> extends AbstractProcessor<
    PageComponentProps<TComponentDefinitionModel>,
    StandardPageComponentArgs<TComponentDefinitionModel>,
    TComponentDefinitionModel> {
    override generateInnerComponent(args: StandardPageComponentArgs<TComponentDefinitionModel>): JSX.Element {

        let abstractPageProcessorContextObjRef = useRef<AbstractPageProcessorContextObj>(new AbstractPageProcessorContextObj({
            submit: async () => {
                let draft = DraftManager.getDraft(DraftManager.keys.instanceDataDraftKey())

                let hasInvalidData = DataUtils.hasAnyChildWithInvalidData(AssetsManager.getInstanceData())

                if (hasInvalidData) {
                    Alert.alert(translate('builtin_validation_error_title'), translate('builtin_validation_sync_error'))

                    return false
                }

                return await AssetsManager.sync(draft !== null).then(() => {
                    // After sync, close
                    InternalUtils.navigation.exit()
                    return true
                })
            },
        }))

        let [content, additionalData] = this.generateContent(args, abstractPageProcessorContextObjRef.current);

        additionalData.abstractPageProcessorContextObj = abstractPageProcessorContextObjRef.current

        useLayoutEffect(() => {

            this.applyHeaderDef(args, additionalData)

        }, [args.navigation])

        // If first page, handle back button for android manually
        if (args.firstPage) {
            let handleBackButtonClick = useCallback(() => {
                this.closePage(args.dataContext)
                    .then(() => {
                    })

                return true
            }, [])

            useEffect(() => {
                BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick)
                return () => {
                    BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick)
                }
            }, [])
        }

        return (
            <AbstractPageProcessorContext.Provider value={abstractPageProcessorContextObjRef.current}>
                {content}
            </AbstractPageProcessorContext.Provider>)
    }

    abstract generateContent(args: StandardPageComponentArgs<TComponentDefinitionModel>, abstractPageProcessorContextObj: AbstractPageProcessorContextObj): [JSX.Element, any]

    abstract getNavigationOptions(args: StandardPageComponentArgs<TComponentDefinitionModel>, navigationOptions: any, additionalData: any): any

    async closePage(dataContext: PageLevelDataContext) {

        let draft = await DraftManager.getDraft(DraftManager.keys.instanceDataDraftKey())

        if (!draft) {
            // If there is no draft, close page,
            await this.removeDraftAndClosePage()

            return
        }

        let buttons: AlertButton[] = [];

        // Check if there is any invalid field, if yes, do not show Save option
        if (!DataUtils.hasAnyChildWithInvalidData(dataContext.formData)) {
            buttons.push({
                text: converters.localization.translate('builtin_save'),
                onPress: () => {
                    AssetsManager.sync(draft !== null).then(() => {
                        // After sync, close
                        InternalUtils.navigation.exit()
                    })
                }
            })
        }

        let defaultButtons: AlertButton[] = [
            {
                text: converters.localization.translate('builtin_save_as_draft'),
                // If the user confirmed, then we dispatch the action we blocked earlier
                // This will continue the action that had triggered the removal of the screen
                onPress: () => {
                    this.saveDraftAndClosePage()
                },
            },
            {
                text: converters.localization.translate('builtin_discard_draft'),
                style: 'destructive',
                // If the user confirmed, then we dispatch the action we blocked earlier
                // This will continue the action that had triggered the removal of the screen
                onPress: () => {
                    this.removeDraftAndClosePage()
                },
            }];

        buttons = [...buttons, ...defaultButtons]

        let title = translate('builtin_default_going_back_title')
        let message = translate('builtin_default_going_back_message')

        // Prompt the user before leaving the screen
        Alert.alert(
            title,
            message,
            buttons
        );
    }

    async removeDraftAndClosePage() {
        await DraftManager.removeDraft(DraftManager.keys.instanceDataDraftKey())

        InternalUtils.navigation.exit()
    }

    async saveDraftAndClosePage() {
        await DraftManager.saveDraft(DraftManager.keys.instanceDataDraftKey(), AssetsManager.getInstanceData())

        InternalUtils.navigation.exit()
    }

    // @ts-ignore
    getRightNavigationItem(args: StandardPageComponentArgs<TComponentDefinitionModel>, additionalData: any): RightNavigationItem[] {
        return []
    }

    applyHeaderDef(args: StandardPageComponentArgs<TComponentDefinitionModel>, additionalData: any) {
        let navigation = args.navigation

        let options: any = {
            title: Expressions.getValueFromLocalizedKey({
                expressionStr: args.jsonDef.title ?? "",
                dataContext: args.dataContext
            })
        }

        let rightNavigationItems = this.getRightNavigationItem(args, additionalData)

        // add back button at the first screen
        if (args.firstPage) {
            options.headerLeft = () => {
                return (
                    <TouchableOpacity
                        style={{marginRight: 32}}
                        onPress={() => this.closePage(args.dataContext)}
                        hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
                    >
                        <SkedIcon style={{
                            height: Platform.OS === 'ios' ? 24 : 20,
                            width: Platform.OS === 'ios' ? 24 : 20,
                            tintColor: ThemeManager.getColorSet().white
                        }} iconType={IconTypes.BackArrow}/>
                    </TouchableOpacity>
                )
            }

            if (AssetsManager.getResources().jsonDef.readonly !== true) {
                options.headerRight = () => {
                    return <FirstPageRightNavigationComponent
                        submit={additionalData.abstractPageProcessorContextObj.actions.submit}
                        items={rightNavigationItems}/>
                }
            }
        }

        if (!options.headerRight && rightNavigationItems.length > 0) {
            options.headerRight = () => {
                return <NavigationItemsView items={rightNavigationItems}/>
            }
        }

        navigation.setOptions(this.getNavigationOptions(args, options, additionalData));
    }
}

export default AbstractPageProcessor
