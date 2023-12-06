import * as React from 'react'
import AbstractPageProcessor, {
    AbstractPageProcessorContextObj,
    StandardPageComponentArgs
} from "./AbstractPageProcessors";
import {
    ListRenderItemInfo,
    Platform,
    SectionList,
    Text, TouchableOpacity,
    View
} from "react-native";
import Expressions from "../../expression/Expressions";
import ListViewProcessorManager from "../list_page_views/ListViewProcessorsManager";
import MexAsyncText from "../../../../components/MexAsyncText";
import StylesManager from "../../../StylesManager";
import ThemeManager from "../../../colors/ThemeManager";
import InternalUtils, {FilterByExpressionInfo, translateOneLevelOfExpression} from "../../InternalUtils";
import {useCallback, useState, useRef, useMemo, useEffect, useReducer} from "react";
import {RightNavigationItem} from "../../../../components/NavigationItemsView";
import * as lodash from "lodash";
import { Dictionary } from 'lodash';
import {ListPageSectionHeaderComponent} from "../../../../components/ListPage/ListPageSectionHeader";
import {ListPageFooterComponent} from "../../../../components/ListPage/ListPageFooter";
import {ListPageHeaderComponent} from "../../../../components/ListPage/ListPageHeader";
import {ListPageChildComponent} from "../../../../components/ListPage/ListPageChild";
import {ListPageSearchBarSectionComponent} from "../../../../components/ListPage/ListPageSearchBarSectionComponent";
import {ListPageComponentModel} from "@skedulo/mex-types";
import {PageProcessorContext, useCrudOnPage} from "../../../hooks/useCrudOnPage";
import {ImagesResource} from "../../../../img/Images";
import SkedIcon from "../../../../components/SkedIcon";
import {IconTypes} from "@skedulo/mex-engine-proxy";
import {runInAction} from "mobx";
import {useHasSection} from "../../../hooks/list/useHasSection";
import {useOrderBy} from "../../../hooks/list/useOrderBy";

type ListPageProcessorRefFunctions = {
    toggleShowBarVisibility: () => void
}

class ListPageProcessorContextObj {
    constructor(actions: ListPageProcessorRefFunctions) {
        this.actions = actions
    }

    actions: ListPageProcessorRefFunctions
}

export type ListPageRenderResult = {
    listPageProcessorContext: ListPageProcessorContextObj
}

class ListPageProcessor extends AbstractPageProcessor<ListPageComponentModel> {

    getTypeName(): string {
        return "list";
    }

    generateContent(args: StandardPageComponentArgs<ListPageComponentModel>, abstractPageProcessorContextObj: AbstractPageProcessorContextObj): [JSX.Element, any] {
        let CurrentChildComponent = useRef<React.FC<any>|null>(null)

        let {jsonDef, dataContext} = args
        if (jsonDef.search?.advancedFilter?.defaultData && !dataContext.filter) {
            dataContext.filter = translateOneLevelOfExpression({jsonDef: jsonDef.search.advancedFilter.defaultData, dataContext: dataContext})
        }

        const [searchText, setSearchText] = useState('')

        let [showFilter, setShowFilter] = useState(false)

        const { pageProcessorContextObj } = useCrudOnPage({
            navigation: args.navigation,
            dataContext: dataContext,
            firstPage: args.firstPage,
            abstractPageProcessorContextObj: abstractPageProcessorContextObj,
            navigationContext: args.navigationContext,
            confirmingGoingBack: false
        }) ?? {}

        let toggleShowBarVisibility = useCallback(() => {
            let newShowSearchBar = !showFilter

            setShowFilter(newShowSearchBar)
        }, [showFilter]);

        let listPageProcessorContextObjRef = useRef<ListPageProcessorContextObj>(new ListPageProcessorContextObj({
            toggleShowBarVisibility: toggleShowBarVisibility
        }))

        // We need to bind again for the new reference of the callback
        listPageProcessorContextObjRef.current.actions.toggleShowBarVisibility = toggleShowBarVisibility

        let additionalData: ListPageRenderResult = {
            listPageProcessorContext: listPageProcessorContextObjRef.current
        }

        let styles = StylesManager.getStyles()
        let colors = ThemeManager.getColorSet()

        let source = Expressions.getRawDataValueExpression({
            dataContext: dataContext,
            expressionStr: jsonDef.sourceExpression
        })

        const renderItem = (props: any) => {

            const {item}: ListRenderItemInfo<any> = props

            if (!CurrentChildComponent.current) {
                let processor = ListViewProcessorManager.findProcessor(jsonDef.itemLayout.type);

                if (!processor) {
                    return (<Text>Not found for view type {jsonDef.itemLayout.type}</Text>)
                }

                CurrentChildComponent.current = processor.generateComponent()
            }

            return (
                <ListPageChildComponent
                    navigationContext={args.navigationContext}
                    childContentComponent={CurrentChildComponent.current}
                    jsonDef={jsonDef}
                    dataContext={{ ...dataContext, item }}
                    />)
        };

        const renderEmptyLayout = useCallback(() => {

            const getEmptyText = async (): Promise<string> => {
                let emptyText = Expressions.getValueFromLocalizedKey({
                    expressionStr: jsonDef.emptyText,
                    dataContext: args.dataContext
                })

                if (emptyText instanceof Promise) {
                    return await emptyText
                }

                return emptyText;
            }

            return (
                <MexAsyncText promiseFn={getEmptyText}>
                    {(text) => (
                        <Text style={[
                            styles.textRegular, {
                                alignSelf: "center",
                                marginTop: 10,
                                color: colors.navy600
                            }]}>{text}</Text>)}
                </MexAsyncText>)
        }, [dataContext])

        const renderHeaderLayout = useCallback(() => {
            return <ListPageHeaderComponent dataContext={args.dataContext} navigationContext={args.navigationContext} jsonDef={args.jsonDef} />
        }, [args.dataContext])

        const renderFooterLayout = useCallback((): React.ReactElement => {
           return <ListPageFooterComponent dataContext={dataContext} jsonDef={args.jsonDef}/>
        }, [args.dataContext]);

        const renderSectionHeader = useCallback(({section: {title}}:any) => {
            if (!jsonDef.hasSection)
                return <></>

            let dataContext:any = {
                ...args.dataContext,
                sectionItem: {title: title}
            }

            return <ListPageSectionHeaderComponent title={jsonDef.hasSection!.sectionTitleText} dataContext={dataContext} />
        }, [args.dataContext]);

        const renderSearchBar = useCallback(() => {

            if (!showFilter)
                return <></>

            return (<ListPageSearchBarSectionComponent
                defaultSearchText={searchText}
                navigationContext={args.navigationContext}
                dataContext={dataContext}
                jsonDef={jsonDef.search}
                onFilterChanged={(searchText, advancedFilterObj) => {

                    if (jsonDef.search?.filterOnProperties) {
                        setSearchText(searchText)
                    }

                    if (jsonDef.search?.advancedFilter?.ui) {
                        if (jsonDef.search?.advancedFilter.events?.afterFilterSubmit) {
                            Expressions.runFunctionExpression({dataContext: dataContext, functionExpression: jsonDef.search.advancedFilter.events.afterFilterSubmit})
                        }

                        runInAction(() => {
                            dataContext.filter = advancedFilterObj
                        })
                    }

                    toggleShowBarVisibility()
                }}
                toggleShowBarVisibility={toggleShowBarVisibility}/>)
        }, [args.dataContext, searchText, showFilter])

        if (jsonDef.search) {
            source = useMemo(() => {

                let filterOnProperties:string[]|undefined = undefined
                let filterExpressions:FilterByExpressionInfo|undefined = undefined

                if (searchText && searchText != "") {
                    filterOnProperties = jsonDef.search!.filterOnProperties
                }

                if  (jsonDef.search?.advancedFilter?.expression) {
                    filterExpressions = {
                        dataContext: dataContext,
                        expression: jsonDef.search.advancedFilter.expression
                    }
                }

                if (filterOnProperties || filterExpressions) {
                    // if there is filter, run the filtering, otherwise, don't
                    return InternalUtils.data.getFilterSourceByKeywords(
                        source,
                        searchText,
                        filterOnProperties,
                        filterExpressions
                    )
                }

                return source
            }, [source, source?.length, dataContext, dataContext.filter, searchText])
        }

        if (jsonDef.orderBy) {
            source = useOrderBy(source, jsonDef.orderBy)
        }

        let finalizedData = useHasSection(source, jsonDef.hasSection)

        return [(
            <PageProcessorContext.Provider value={pageProcessorContextObj}>
                <View style={{flex: 1, backgroundColor:ThemeManager.getColorSet().white}}>
                    <SectionList
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%"
                        }}
                        renderItem={renderItem}
                        keyExtractor={(item, _) => item.UID.toString()}
                        stickyHeaderHiddenOnScroll={true}
                        scrollEnabled={source.length > 0}
                        ListHeaderComponent={renderHeaderLayout}
                        ListEmptyComponent={renderEmptyLayout}
                        ListFooterComponent={renderFooterLayout}
                        renderSectionHeader={renderSectionHeader}
                        stickyHeaderIndices={[1]}
                        sections={finalizedData}/>

                    <View
                        pointerEvents={'box-none'}
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%"
                        }}>
                        {renderSearchBar()}
                    </View>
                </View>
            </PageProcessorContext.Provider>
        ), additionalData]
    }

    // @ts-ignore
    getNavigationOptions(args: StandardPageComponentArgs<ListPageComponentModel>, navigationOptions: any, additionalData: any): any {
        if (!args.firstPage) {
            if (Platform.OS === 'ios') {
                navigationOptions.headerLeft = () => {
                    return (
                        <TouchableOpacity
                            onPress={() => {
                                args.navigation.goBack();
                            }}
                            hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
                            style={{ marginRight: 10 }}>
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

    // @ts-ignore
    override getRightNavigationItem(args: StandardPageComponentArgs<ListPageComponentModel>, additionalData: any): RightNavigationItem[] {

        let listPageAdditionalData = additionalData as ListPageRenderResult
        let items: RightNavigationItem[] = []

        if (args.jsonDef.search && (args.jsonDef.search.filterOnProperties || args.jsonDef.search.advancedFilter?.ui)) {
            items.push({
                iconSource: () => ImagesResource.Search,
                onClicked: () => {
                    listPageAdditionalData.listPageProcessorContext.actions.toggleShowBarVisibility() }
            })
        }

        return items;
    }

    override useObservable() {
        return true;
    }
}

export default ListPageProcessor;
