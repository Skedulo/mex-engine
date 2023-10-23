import * as React from 'react'
import {useContext, useRef} from 'react'
import {KeyboardAvoidingView, Platform, Text,} from 'react-native';
import {makeObservable, observable, runInAction} from "mobx";
import AssetsManager from "../assets/AssetsManager";
import {ThemeContext} from "./WithManageTheme";
import {InstanceDataContext} from "./WithManageInstanceData";
import PageProcessorManager from '../common/processors/page/PageProcessorsManager';
import {NavigationContext} from "../common/NavigationProcessManager";
import {PageComponentProps} from "../common/processors/page/AbstractPageProcessors";
import {AllPageComponentModel} from "@skedulo/mex-types";
import Expressions from "../common/expression/Expressions";
import lodash from "lodash";
import {translateOneLevelOfExpression} from "../common/InternalUtils";
import utils from "../common/Utils";

type Props = {
    route: any,
    navigation: any
}

const MexEngineScreen: React.FC<Props> = ({route, navigation}) => {
    // Page data store as ref, so in case InstanceDataContext is changed, it won't lose the current data
    let pageDataRef = useRef<any>();

    // Force Subscribe to theme changed
    useContext(ThemeContext)
    // Force Subscribe to data changed
    useContext(InstanceDataContext)

    const resources = AssetsManager.getResources()
    const jsonDefPages = resources.jsonDef.pages

    const pageId = route.params.pageId
    const firstPage= route.params.firstPage

    let pageDef = jsonDefPages[pageId];

    // If 'wipeExistingData' flag is on, we want to make pageData undefined
    const translatedDataContextOfPageDataLevel = AssetsManager.getPageLevelData(!pageDef.wipeExistingData ? route : null)

    // We should keep the originalPageData in case using 'wipeExistingData' flag
    if (pageDef.wipeExistingData) {
        translatedDataContextOfPageDataLevel.originalPageData = lodash.cloneDeep(route.params.pageData)
    }

    if (!pageDataRef.current) {

        if (pageDef.pageDataExpression && !translatedDataContextOfPageDataLevel.pageData && !pageDef.wipeExistingData) {
            // We're cloning the data when there is no pageData coming from the route (probably previous page), this is happening when user access to the First Page.
            translatedDataContextOfPageDataLevel.pageData = lodash.cloneDeep(Expressions.getValueExpression({
                expressionStr: pageDef.pageDataExpression,
                dataContext: translatedDataContextOfPageDataLevel
            }))
        }

        if ((translatedDataContextOfPageDataLevel.pageData === null || translatedDataContextOfPageDataLevel.pageData === undefined) && pageDef.defaultPageData) {
            // If PageData is still not available, we give user final attempt to initialize their own data on UI Definition
            translatedDataContextOfPageDataLevel.pageData = translateOneLevelOfExpression({jsonDef: pageDef.defaultPageData.data, dataContext: translatedDataContextOfPageDataLevel});
        }
        else if (pageDef.defaultPageData) {

            // If PageData is already available, we still flat out the defaultPageData to apply missing properties
            translatedDataContextOfPageDataLevel.pageData = {
                ...translateOneLevelOfExpression({jsonDef: pageDef.defaultPageData.data, dataContext: translatedDataContextOfPageDataLevel}),
                ...translatedDataContextOfPageDataLevel.pageData
            }
        }

        if (translatedDataContextOfPageDataLevel.pageData) {
            // Only process these data if pageData is defined
            if (!translatedDataContextOfPageDataLevel.pageData.__typename && pageDef.defaultPageData?.objectName) {
                translatedDataContextOfPageDataLevel.pageData.__typename = pageDef.defaultPageData.objectName
            }

            if (!translatedDataContextOfPageDataLevel.pageData.UID) {
                translatedDataContextOfPageDataLevel.pageData.UID = utils.data.generateUniqSerial()
            }
        }

        pageDataRef.current = makeObservable(translatedDataContextOfPageDataLevel, {
            formData: observable,
            pageData: observable})

    } else {
        runInAction(() => {
            pageDataRef.current.formData = translatedDataContextOfPageDataLevel.formData
            pageDataRef.current.sharedData = translatedDataContextOfPageDataLevel.sharedData
        })
    }

    const pageLevelData = pageDataRef.current

    if (!route.params.navigationContext) {
        route.params.navigationContext = new NavigationContext()
    }

    if (pageDef.events?.onPreDataLoad) {
        pageDataRef.current.originalPageData = pageDataRef.current.pageData

        /* If there is OnDataPreLoad define, we want to convert the pageData into another type of object */
        pageDataRef.current.pageData = Expressions.runFunctionExpression({
            functionExpression: pageDef.events!.onPreDataLoad!,
            dataContext: pageLevelData
        })
    }


    const navigationContext:NavigationContext = route.params.navigationContext

    navigationContext.currentDataContext = pageLevelData;

    if (pageDef.pageDataExpression) {
        // If pageDataExpression is defined,  we should indicate that the sourceExpression for this data is coming from defaultPageDataExpression
        navigationContext.sourceExpression = pageDef.pageDataExpression
    }

    if (!pageDef) {
        return <Text>Page not found</Text>
    }

    let processor = PageProcessorManager.findProcessor(pageDef.type)

    if (!processor) {
        return <Text>Page type is incorrect.</Text>
    }

    let RootComponent = processor.generateComponent() as  React.FC<PageComponentProps<AllPageComponentModel>>

    const iosHeaderHeight = 100 /* 100 is the sweet box for the offset, somehow the react-native-navigation is messing-up with the keyboard avoiding view */

    return (
        <KeyboardAvoidingView
            keyboardVerticalOffset={Platform.OS === 'ios' ? iosHeaderHeight : undefined}
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <RootComponent args={{
                navigationContext: navigationContext,
                jsonDef: pageDef,
                dataContext: pageLevelData,
                navigation: navigation,
                firstPage: firstPage
            }}/>
        </KeyboardAvoidingView>)
}

export default MexEngineScreen
