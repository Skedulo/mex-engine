import React, {useRef, RefObject} from 'react';
import AssetsManager from "../assets/AssetsManager";
import DataUtils from "../common/utils/DataUtils";
import InternalUtils, {translateOneLevelOfExpression} from "../common/InternalUtils";
import * as lodash from "lodash";
import {Alert, AlertButton} from "react-native";
import converters from "../common/Converters";
import {translate} from "../assets/LocalizationManager";
import Expressions from "../common/expression/Expressions";
import {AbstractPageProcessorContextObj} from "../common/processors/page/AbstractPageProcessors";
import {FlatPageContentViewRefFunctions} from "../../components/CoreUIRenderers/FlatContentViewRenderer";
import DraftManager from "../assets/DraftManager";
import NavigationProcessManager, {NavigationContext} from "../common/NavigationProcessManager";
import {OneLevelBindingObject} from "@skedulo/mex-types/dist/common/CommonTypes";
import {FunctionExpressionType} from "@skedulo/mex-types";
import {ExtHelperImpl} from "../common/utils/ExtHelper";

export type UseCrudOnPageArgs = {
    navigation: any
    dataContext: any
    firstPage: boolean
    abstractPageProcessorContextObj: AbstractPageProcessorContextObj
    navigationContext: NavigationContext
    defaultDataForNewObject?: OneLevelBindingObject
    confirmingGoingBack: boolean
    allowSaveDraftOnInvalid?: boolean,
    alwaysAsNewData?: boolean /* this indicate that when data is submitted, it should be always treat as "new" */,
    events?: {
        onPreDataSave?: FunctionExpressionType
    }
}
export class PageSubmitOption {
    stopWhenInvalid = false
}

export type UseCrudResult = {
    pageProcessorContextObj: PageProcessorContextObj
    pageContentViewRefFunctions: RefObject<FlatPageContentViewRefFunctions>
    finalizeEditingAndBack: (triggerGoBack?: boolean, saveAsDraft?: boolean) => Promise<boolean>
    ignoreGoBackCondition: React.MutableRefObject<boolean>
}

export type PageProcessorRefFunctions = {
    submit: (options?: PageSubmitOption) => Promise<boolean>
    submitFormWithCondition: (triggerGoBack: boolean, saveAsDraftWhenValid: boolean, showOptionsWhenInvalid?: boolean) => Promise<boolean>,
    markAsFinishEditing: () => void,
    controlRequestOutFocus: (key: any) => void
}

export type FocusableComponentData = {
    canFocus: boolean,
    requestFocus?: (callbackFunc:() => void) => void,
    key: any,
}

export class PageProcessorContextObj {
    constructor(actions: PageProcessorRefFunctions) {
        this.actions = actions
    }

    actions: PageProcessorRefFunctions
    focusableControls: FocusableComponentData[] = []
}

export const PageProcessorContext = React.createContext<PageProcessorContextObj|undefined>(undefined)

export type FlatPageRenderResult = {
    flatPageProcessorContext: PageProcessorContextObj | undefined
}

export const useCrudOnPage = (
    {
        navigation,
        dataContext,
        firstPage,
        abstractPageProcessorContextObj,
        navigationContext,
        defaultDataForNewObject,
        confirmingGoingBack,
        allowSaveDraftOnInvalid,
        alwaysAsNewData,
        events
    }: UseCrudOnPageArgs): UseCrudResult | null => {

    if (!dataContext.pageData) {
        return null
    }

    let originalDataRef = useRef<any>(null)
    let ignoreGoBackCondition = useRef<boolean>(false)
    let pageContentViewRefFunctions = useRef<FlatPageContentViewRefFunctions>(null)

    let pageProcessorContextObjRef: React.MutableRefObject<PageProcessorContextObj>

    pageProcessorContextObjRef = useRef<PageProcessorContextObj>(new PageProcessorContextObj({
        submit: async (options?: PageSubmitOption) => {

            if (firstPage) {
                /* First we need to check if the data is valid or not */
                let submitResult = await pageProcessorContextObjRef.current.actions?.submitFormWithCondition(false, false, !(options?.stopWhenInvalid === true))

                if (!submitResult) {
                    // User does not want to proceed
                    return false
                }

                let hasInvalidData = DataUtils.hasAnyChildWithInvalidData(AssetsManager.getInstanceData())

                if (hasInvalidData) {
                    // User want to proceed but has invalid data, just bail, do not continue to sync
                    InternalUtils.navigation.exit()

                    return false
                }

                /* If everything is ok, start sync and close page */
                return await (abstractPageProcessorContextObj?.actions.submit() ?? Promise.resolve(false))
            } else {
                /* Not first page, which means treat it as normal New/Edit */
                return pageProcessorContextObjRef.current.actions?.submitFormWithCondition(true, true);
            }
        },
        submitFormWithCondition: function (triggerGoBack: boolean = true, saveAsDraftWhenValid: boolean = true, showOptionsWhenInvalid: boolean = true): Promise<boolean> {
            let pageContentViewFunctions = pageContentViewRefFunctions.current

            let validationPromise: Promise<boolean>

            if (pageContentViewFunctions?.validate === undefined) {
                validationPromise = Promise.resolve(true)
            } else {
                validationPromise = pageContentViewFunctions!.validate!()
            }

            return validationPromise
                .then(pageValidationResult => {
                    if (!pageValidationResult)
                        return pageValidationResult

                    // Check if there is any object inside has __invalid state
                    let hasInvalidForChild = DataUtils.hasAnyChildWithInvalidData(dataContext.pageData)

                    return !hasInvalidForChild
                })
                .then((validationResult: boolean) => {
                    if (validationResult) {

                        let pageData = dataContext.pageData

                        if (!pageData.__isCreatingNewObject && !pageData.__invalid && !alwaysAsNewData) {
                            /*
                            This is very tricky to understand, in case of "editing", we need to first validate all the validators, if the validators are all valid
                            We then check if the previous state was invalid or not, if it was valid, and nothing has changed, we do nothing.
                            But if it's invalid state, although if there is no changes, we still prevent user from going back
                            */

                            if (dataContext.originalPageData && events?.onPreDataSave) {
                                /*
                                    If there is PreDataSave and there is originalPageData, we compare with the originalData and the data after transformation
                                    Not with the normal data
                                 */
                                let originalData: any = lodash.cloneDeep(dataContext.originalPageData) ?? {}

                                if (pageData.__hasAttachments !== undefined) {
                                    originalData.__hasAttachments = pageData.__hasAttachments //ignore has attachments property
                                }

                                let hasChanged = !lodash.isEqual(getPreDataSaveObj(pageData), originalData)

                                if (!hasChanged) {
                                    return finalizeEditingAndBack(triggerGoBack, false);
                                }
                            }
                            else
                            {
                                let originalData: any = lodash.cloneDeep(originalDataRef.current) ?? {}

                                let pageDataToCompare = pageData

                                if (events?.onPreDataSave) {
                                    pageDataToCompare = getPreDataSaveObj(pageData)
                                }

                                if (pageDataToCompare.__hasAttachments !== undefined) {
                                    originalData.__hasAttachments = pageDataToCompare.__hasAttachments //ignore has attachments property
                                }

                                let hasChanged = !lodash.isEqual(pageDataToCompare, originalData)

                                if (!hasChanged) {
                                    return finalizeEditingAndBack(triggerGoBack, false);
                                }
                            }
                        }

                        return startSaving(triggerGoBack, false, saveAsDraftWhenValid)
                    } else {
                        if (!showOptionsWhenInvalid)
                            return Promise.resolve(false)

                        return new Promise<boolean>((resolve) => {
                            let buttons: AlertButton[] = []

                            if (allowSaveDraftOnInvalid)
                                buttons.push({
                                    text: converters.localization.translate('builtin_validation_error_save_draft'),
                                    onPress: () => {
                                        startSaving(triggerGoBack, true, saveAsDraftWhenValid).then(didSave => {
                                            resolve(didSave)
                                        })
                                    }
                                })

                            buttons.push( {
                                text: converters.localization.translate('builtin_validation_error_cancel'),
                                style: 'cancel',
                                onPress: () => {
                                    resolve(false)
                                }
                            })

                            Alert.alert(
                                translate('builtin_validation_error_title'),
                                translate(allowSaveDraftOnInvalid ? 'builtin_validation_error_form_saving_description' : 'builtin_validation_error_form_saving__not_allow_draft_description'),
                                buttons)
                        })
                    }
                })
        },
        markAsFinishEditing: function () {
            resetGoingBackDataCheckpoint()
        },
        controlRequestOutFocus: (key: any) => {
            const currentFocusIndex: number = pageProcessorContextObjRef.current.focusableControls.findIndex((item: any) => item.key === key);
            const nextFocusItem: any = currentFocusIndex < 0 || (currentFocusIndex + 1 > pageProcessorContextObjRef.current.focusableControls.length)
                ? {}
                : pageProcessorContextObjRef.current?.focusableControls[currentFocusIndex + 1];
            if (nextFocusItem != null && nextFocusItem.canFocus) {
                nextFocusItem.requestFocus();
            }
        }
    }));

    const startSaving = (triggerGoBack: boolean, isInvalid:boolean = false, saveAsDraftWhenValid:boolean = true) : Promise<boolean> => {
        let prevDataContext = navigationContext.prevPageNavigationContext?.currentDataContext
            ?? navigationContext.currentDataContext /* If there is no prev data context, it's the current data context of the current page (probably in the case editing in the first page) */

        let pageData:any = dataContext.pageData;

        if (defaultDataForNewObject) {

            let defaultData = translateOneLevelOfExpression({jsonDef: defaultDataForNewObject, dataContext})

            pageData = {
                ...dataContext.pageData,
                ...defaultData
            }
        }

        if (pageData.__isTempObject !== undefined) {
            delete pageData.__isTempObject
        }

        // Mark if the pageData is valid or not
        pageData.__invalid = isInvalid

        if (!isInvalid) {
            // Check if any inside data has invalid state, if yes, mark self as invalid
            pageData.__invalid = DataUtils.hasAnyChildWithInvalidData(pageData)
        }

        if (events?.onPreDataSave) {
            pageData = getPreDataSaveObj(pageData)
        }

        InternalUtils.data.upsertToExpression({
            destinationDataExpression: navigationContext.sourceExpression,
            sourceData: pageData,
            destinationDataContext: prevDataContext,
            compareProperty: null,
            alwaysAsNewData: alwaysAsNewData ?? false
        })

        // This is a precaution when user have invalid state, they can close the app immediately, we still need this for being able to mark the invalid to parent in this case
        if (isInvalid) {
            InternalUtils.data.markAndLoopParentsAsInvalid(navigationContext)
        }

        return finalizeEditingAndBack(triggerGoBack, isInvalid || saveAsDraftWhenValid);
    }

    const getPreDataSaveObj = (pageData: any):any => {
        let newPageData = Expressions.runFunctionExpression(
            { functionExpression: events!.onPreDataSave!, dataContext: {...dataContext, pageData},
                extras: { extHelper: new ExtHelperImpl(pageProcessorContextObjRef.current)}})

        // We copy all the properties with __ prefix to new model
        if (newPageData && !Array.isArray(newPageData)) {
            for(let property in pageData) {
                if (property.startsWith("__")) {
                    newPageData[property] = pageData[property]
                }
            }
        }

        /* Merge new data with the original page data */
        return { ...(dataContext.originalPageData ?? {}), ...newPageData }
    }

    const finalizeEditingAndBack = async (triggerGoBack: boolean = true, saveAsDraft:boolean = true): Promise<boolean> => {

        pageProcessorContextObjRef.current.actions.markAsFinishEditing()

        if (saveAsDraft && InternalUtils.data.isSavingOnFormData(navigationContext)) {
            await DraftManager.saveDraft(DraftManager.keys.instanceDataDraftKey(), dataContext.formData)
        }

        if (triggerGoBack) {
            NavigationProcessManager.goBack()
        }

        return true
    }

    const confirmGoingBack = (e:any) => {
        if (!confirmingGoingBack) {
            /* Probably List page case for now, when on List Page, if user bail out, we need to always save back the current page data to the source now */
            e.preventDefault();

            // If this is not a new object, treat as a normal save operation
            pageProcessorContextObjRef.current.actions.submitFormWithCondition(false, true).then((isOk: boolean) => {
                if (isOk) {
                    // Trigger go back if validation is valid
                    navigation.dispatch(e.data.action)
                }
            })

            return;
        }

        if (ignoreGoBackCondition.current) {
            return // If ignore go back condition is set to true, we don't want to check anything
        }

        let pageData = dataContext.pageData

        if (!pageData.__isCreatingNewObject) {
            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // If this is not a new object, treat as a normal save operation
            pageProcessorContextObjRef.current.actions.submitFormWithCondition(false, true).then((isOk: boolean) => {

                if (isOk) {
                    // Trigger go back if validation is valid
                    navigation.dispatch(e.data.action)
                }
            })

            return;
        }

        let originalData:any = lodash.cloneDeep(originalDataRef.current) ?? {}

        if (pageData.__hasAttachments !== undefined) {
            originalData.__hasAttachments =  pageData.__hasAttachments //ignore has attachments property
        }

        let hasChanged = !lodash.isEqual(pageData, originalData)

        if (!hasChanged) {
            return;
        }

        // Prevent default behavior of leaving the screen
        e.preventDefault();

        let buttons: AlertButton[] = [
            { text: converters.localization.translate('no'), style: 'cancel', onPress: () => {} },
            {
                text: converters.localization.translate('yes'),
                style: 'destructive',
                // If the user confirmed, then we dispatch the action we blocked earlier
                // This will continue the action that had triggered the removal of the screen
                onPress: () => {
                    navigation.dispatch(e.data.action)
                },
            }];

        let title, message;

        title = converters.localization.translate('builtin_default_going_back_title')
        message = converters.localization.translate('builtin_default_going_back_message')

        // Prompt the user before leaving the screen
        Alert.alert(
            Expressions.getValueFromDollarSignExpression({expressionStr: title, dataContext }) as string,
            Expressions.getValueFromDollarSignExpression({expressionStr: message, dataContext }) as string,
            buttons
        );
    }

    const resetGoingBackDataCheckpoint = (): void => {
        originalDataRef.current = lodash.cloneDeep(dataContext.pageData)
    }

    if (!originalDataRef.current) {
        resetGoingBackDataCheckpoint()
    }

    React.useEffect(
        () => {
            navigation.addListener('beforeRemove', confirmGoingBack)

            return () => {
                navigation.removeListener('beforeRemove', confirmGoingBack)
            }
        }, [navigation]
    );

    return {
        pageProcessorContextObj: pageProcessorContextObjRef.current,
        pageContentViewRefFunctions: pageContentViewRefFunctions!,
        finalizeEditingAndBack: finalizeEditingAndBack,
        ignoreGoBackCondition: ignoreGoBackCondition
    }
};
