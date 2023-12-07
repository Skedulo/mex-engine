import * as React from 'react'
import {useCallback, useEffect, useReducer, useRef, useState} from 'react'
import {
    ActivityIndicator,
    BackHandler,
    Dimensions,
    FlatList,
    Image,
    LayoutChangeEvent,
    Platform, SectionList,
    StatusBar,
    StyleProp,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import Expressions from "../../expression/Expressions";
import * as lodash from "lodash";
import ThemeManager from "../../../colors/ThemeManager";
import {PageLevelDataContext} from "../../../assets/AssetsManager";
import converters from "../../Converters";
import StylesManager from "../../../StylesManager";
import MexAsyncText from "../../../../components/MexAsyncText";
import NavigationProcessManager from "../../NavigationProcessManager";
import SearchBar from "../../../../components/SearchBar";
import {BottomModal} from "../../../../components/AnimationModal";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SelectScreenRowMemo, {areItemEqual} from "./SelectScreenRow";
import {useSelectScreenOfflineSource} from "./hooks/useSelectScreenOfflineSource";
import {OnlineSourceStatus, useSelectScreenOnlineSource} from "./hooks/useSelectScreenOnlineSource";
import {translate} from '../../../assets/LocalizationManager';
import InternalUtils from "../../InternalUtils";
import {ImagesResource} from "../../../../img/Images";
import {SelectPageConfig} from "@skedulo/mex-types";
import {useOrderBy} from "../../../hooks/list/useOrderBy";
import {useHasSection} from "../../../hooks/list/useHasSection";
import {ListPageSectionHeaderComponent} from "../../../../components/ListPage/ListPageSectionHeader";

const { height: screenHeight } = Dimensions.get('window');

const statusBarHeight:number|undefined = StatusBar.currentHeight;

type Props = {
    route: any,
    navigation: any
}

const SelectScreenName = "selectScreen"

const SelectScreen: React.FC<Props> = ({route}) => {

    let styles = StylesManager.getStyles()
    let styleConst = StylesManager.getStyleConst()
    let colors = ThemeManager.getColorSet()
    const safeAreaInsets = useSafeAreaInsets();
    const dataContextRef = useRef<PageLevelDataContext>(route.params.dataContext)
    let dataContext = dataContextRef.current
    const maxHeight = screenHeight - safeAreaInsets.top - (Platform.OS === 'android' ? (statusBarHeight || 0) + 15 : 0);
    const selectPageConfig = route.params.jsonDef as SelectPageConfig
    let selectedData: any = []

    if (route.params.selectedData) {

        let tmpSelectedData = route.params.selectedData

        if (typeof tmpSelectedData !== 'object') {
            // is a string, therefore parse it into vocab structure
            tmpSelectedData = { Value: tmpSelectedData };
        }

        selectedData = selectPageConfig.isMultiSelect ? tmpSelectedData : [tmpSelectedData]
    }

    let [searchText, setSearchText] = useState("")
    const [, forceUpdate] = useReducer(x => x + 1, 0, undefined)
    let selectedItemsRef = useRef<any[]>(selectedData)
    let [showSearchBarWhenHasEnoughSpace, setShowSearchBarWhenHasEnoughSpace] = useState(false)
    let [flatListHeight, setFlatListHeight] = useState<number|undefined>(undefined)

    let data : any = null
    let status = OnlineSourceStatus.Loading

    if (selectPageConfig.onlineSource) {
        let translatedVariables = useRef<any>()

        if (!translatedVariables.current) {
            translatedVariables.current = InternalUtils.data.translateOneLevelOfExpression({
                dataContext: dataContext,
                jsonDef: selectPageConfig.onlineSource.variables
            })
        }

        let onlineResult = useSelectScreenOnlineSource({
            dataContext: dataContext,
            searchText: searchText,
            selectPageConfig: selectPageConfig,
            variables: translatedVariables.current
        });

        status = onlineResult.status
        data = onlineResult.data
    } else {
        let offlineResult = useSelectScreenOfflineSource({
            dataContext: dataContext,
            searchText: searchText,
            selectPageConfig: selectPageConfig
        });

        data = offlineResult.data
        status = OnlineSourceStatus.Loaded
    }

    let finalSource = data;

    let debounceFunc = lodash.debounce(function(height: number) {
        if (flatListHeight) {
            // Nothing, we already have the height
            return
        }

        setFlatListHeight(height)
    }, 250, {'leading': false})

    function onContentViewLayout(event: LayoutChangeEvent) {
        if (showSearchBarWhenHasEnoughSpace) {
            return
        }

        let heightDiffBuffer = 20

        if (event.nativeEvent.layout.height + heightDiffBuffer >= maxHeight) {
            // When the view height grow enough, show the search bar
            setShowSearchBarWhenHasEnoughSpace(true)
        }
    }

    function onFlatListLayout(event: LayoutChangeEvent) {
        debounceFunc(event.nativeEvent.layout.height)
    }

    let header = selectPageConfig.header ?? { title: undefined, hasClearBtn: true};

    const headerTitle = header.title ? Expressions.getValueFromLocalizedKey({
        expressionStr: header.title,
        dataContext: dataContext
    }) : ""

    useEffect(() => {
        BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
        return () => {
            BackHandler.removeEventListener("hardwareBackPress", onHardwareBackPress);
        }
    }, [selectedItemsRef.current]);

    const onHardwareBackPress = useCallback(():boolean => {
        handleCloseButtonClick();
        return true
    }, [selectedItemsRef.current])

    const onTouchOutSide = () => {
        handleCloseButtonClick();
    }

    const handleCloseButtonClick =  useCallback(() => {
        if (selectedItemsRef.current.length > 0) {
            NavigationProcessManager.goBack(selectPageConfig.isMultiSelect ? selectedItemsRef.current : selectedItemsRef.current[0])
        } else {
            NavigationProcessManager.goBack(null)
        }
    }, [selectedItemsRef.current])

    const handleClearButtonClick =  () => {
        setSelectedItems([])
        if (!selectPageConfig.isMultiSelect) {
            // single select: close pop up when click clear button
            handleCloseButtonClick()
        }
    }

    let setSelectedItems = (items: any[]) : void => {
        selectedItemsRef.current = items

        forceUpdate()
    }

    const handleClick = useCallback((item: any) => {
        if (selectPageConfig.singleSelectionConfig && selectPageConfig.singleSelectionConfig.dismissPageAfterChosen) {
            NavigationProcessManager.goBack(item)
        } else {
            if (!selectPageConfig.isMultiSelect) {
                // Not multi select, clear previous value
                setSelectedItems([item])
            } else {
                const existedItems = selectedItemsRef.current.find((sItem: any) => areItemEqual(sItem, item))

                if (existedItems) {
                    const newValueSelected = selectedItemsRef.current.filter((cItem:any) => !areItemEqual(cItem, existedItems))
                    setSelectedItems(newValueSelected)
                } else {
                    const newValueSelected = [...selectedItemsRef.current, item]
                    setSelectedItems(newValueSelected)
                }
            }
        }

    }, [selectedItemsRef.current])

    const renderItem = useCallback(({item}: any) => {
        let isSelected = selectedItemsRef.current.filter((sItem: any) => areItemEqual(sItem, item)).length > 0

        return (<SelectScreenRowMemo
            dataContext={dataContext}
            onItemSelected={handleClick}
            item={item}
            selectPageConfig={selectPageConfig}
            isSelected={isSelected}/>)
    }, [dataContext, handleClick])

    function renderEmptyLayout() {

        const getEmptyText = async (): Promise<string> => {
            let emptyText = Expressions.getValueFromLocalizedKey({
                expressionStr: selectPageConfig.emptyText,
                dataContext: dataContext
            })

            if (emptyText instanceof Promise) {
                return await emptyText
            }

            return emptyText;
        }

        return (
            <View style={{flexDirection: "column", flex: 1}}>

                <Image
                    resizeMode={"contain"}
                    style={{
                        marginTop: styleConst.defaultVerticalPadding,
                        marginHorizontal: styleConst.defaultHorizontalPadding,
                        width: 100,
                        height: 100,
                        alignSelf: "center",
                    }}
                    source={ImagesResource.NoResults} />

                <MexAsyncText promiseFn={getEmptyText}>
                    {(text) => (
                        <Text style={[
                            styles.textRegular, {
                                alignSelf: "center",
                                marginTop: 10,
                                color: colors.navy600
                            }]}>{text}</Text>)}
                </MexAsyncText>
            </View>)
    }

    const renderSearchBar = () => {

        let hasSearchBarForOnlineSource = selectPageConfig.onlineSource && selectPageConfig.searchBar
        let hasSearchBarForOfflineSource = !selectPageConfig.onlineSource && selectPageConfig.searchBar && showSearchBarWhenHasEnoughSpace

        if (!hasSearchBarForOnlineSource && !hasSearchBarForOfflineSource) {
            return <></>
        }

        const placeholder = Expressions.getValueFromLocalizedKey({
            expressionStr: selectPageConfig.searchBar?.placeholder ?? "builtin_search_placeholder",
            dataContext: dataContext
        }) as string

        let debounceFunc = lodash.debounce(function(text: string) {
            setSearchText(text)
        }, 500, {'leading': false})

        return (
            <SearchBar
                style={{marginBottom: styleConst.defaultVerticalPadding}}
                placeholder={placeholder}
                onChangeText={(text) => debounceFunc(text)}/>
        )
    }
    const renderHeaderBar = () => {
        return <View style={styles.headerBarSelectView}>
            {header.hasClearBtn
                ? <TouchableOpacity style={{ width: 55 }} hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }} onPress={handleClearButtonClick}>
                    <Text
                        allowFontScaling={false}
                        style={[styles.headerButtonText, { color: colors.skedBlue600, textAlign: 'left', alignSelf: 'flex-start' }]}>
                        {converters.localization.translate("builtin_clear")}
                    </Text>
                </TouchableOpacity>
                : <View style={{width: 55 }} />}

            <Text
                allowFontScaling={false}
                ellipsizeMode='tail'
                numberOfLines={1}
                style={[styles.headerButtonText, { color: colors.skeduloText, marginHorizontal: 6, flex: 1, textAlign: 'center'}]}>
                {headerTitle.toString()}
            </Text>

            <TouchableOpacity
                style={{ width: 55 }}
                hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
                onPress={handleCloseButtonClick}>
                <Text
                    allowFontScaling={false}
                    style={[styles.headerButtonText, { color: colors.skedBlue600, textAlign: 'right', alignSelf: 'flex-end'}]}>
                    {converters.localization.translate("builtin_done")}
                </Text>
            </TouchableOpacity>
        </View>
    }

    const renderSeparatorItems = useCallback(() => {
        return (
            <View style={{ height: 12 }} />
        )
    }, [])

    let renderBaseOnStatus = () => {

        if (status == OnlineSourceStatus.Loading) {
            return (<ActivityIndicator color={ThemeManager.getColorSet().skedBlue900} size="large" />)
        }

        if (status == OnlineSourceStatus.RequireInternetConnection || status == OnlineSourceStatus.Failed) {
            return (
                <View style={{flexDirection: "column", flex: 1}}>

                    <Image
                        resizeMode={"contain"}
                        style={{
                            marginTop: styleConst.defaultVerticalPadding,
                            marginHorizontal: styleConst.defaultHorizontalPadding,
                            width: 100,
                            height: 100,
                            alignSelf: "center",
                        }}
                        source={status == OnlineSourceStatus.RequireInternetConnection
                            ? ImagesResource.NoInternet
                            : ImagesResource.LoadingError
                        } />

                    <Text style={[
                        styles.textMedium,
                        {
                            textAlign: "center",
                            paddingTop: styleConst.defaultVerticalPadding,
                            paddingHorizontal: styleConst.defaultHorizontalPadding,
                        }
                    ]}>{translate(status == OnlineSourceStatus.RequireInternetConnection
                        ? "builtin_internet_connection_required"
                        : "builtin_online_search_failed")}
                    </Text>
                </View>)
        }

        let style:StyleProp<ViewStyle>

        if (selectPageConfig.onlineSource) {
            /* In case of online search, we expand to full height */
            style = {
                flex: 1
            }
        } else {
            style = {
                height: flatListHeight
            }
        }

        if (selectPageConfig.orderBy) {
            finalSource = useOrderBy(finalSource, selectPageConfig.orderBy)
        }

        const renderSectionHeader = useCallback(({section: {title}}:any) => {
            if (!selectPageConfig.hasSection)
                return <></>

            let dataContext:any = {
                ...dataContext,
                sectionItem: {title: title}
            }

            return <ListPageSectionHeaderComponent title={selectPageConfig.hasSection!.sectionTitleText} dataContext={dataContext} />
        }, [dataContext])


        let finalizedData = useHasSection(finalSource, dataContext, selectPageConfig.hasSection)

        return (
            <SectionList
                style={style}
                renderItem={renderItem}
                stickyHeaderHiddenOnScroll={true}
                scrollEnabled={showSearchBarWhenHasEnoughSpace}
                onLayout={onFlatListLayout}
                contentContainerStyle={{paddingBottom: styleConst.smallVerticalPadding}}
                contentInsetAdjustmentBehavior="never"
                initialNumToRender={20}
                ListEmptyComponent={renderEmptyLayout}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item, index) => item?.UID ?? item?.Value ?? index}
                ItemSeparatorComponent={renderSeparatorItems}
                stickyHeaderIndices={[1]}
                sections={finalizedData}/>
        )
    }

    let containerStyle:StyleProp<ViewStyle> = {maxHeight: maxHeight, paddingBottom: safeAreaInsets.bottom !== 0 ? safeAreaInsets.bottom : 32};

    if (selectPageConfig.onlineSource) {
        /* In case of online search, we expand to full height */
        containerStyle.height = maxHeight
    }

    return (
        <BottomModal
            visible
            onTouchOutside={onTouchOutSide}
            modalStyle={{ backgroundColor: colors.white, borderTopLeftRadius: 8, borderTopRightRadius: 8, }}>
            {
                (<View
                    onLayout={onContentViewLayout}
                    style={containerStyle}>
                    {renderHeaderBar()}
                    {renderSearchBar()}
                    {renderBaseOnStatus()}
                </View>)
            }
        </BottomModal>
    )
}

export default SelectScreen
export { SelectScreenName }
