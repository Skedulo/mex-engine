import React, {useEffect, useMemo, useRef, useState} from 'react'
import {ListPageSearchComponentModel} from "@skedulo/mex-types";
import {makeObservable, observable} from "mobx";
import StylesManager from "../../mex/StylesManager";
import ThemeManager from "../../mex/colors/ThemeManager";
import {FlatContentViewRenderer, FlatPageContentViewRefFunctions} from "../CoreUIRenderers/FlatContentViewRenderer";
import Expressions from "../../mex/common/expression/Expressions";
import {Image, ScrollView, Text, TextInput, TouchableOpacity, View} from "react-native";
import {translate} from "../../mex/assets/LocalizationManager";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useKeyboardVisible} from "../../mex/hooks/useKeyboardVisible";
import {NavigationContext} from "../../mex/common/NavigationProcessManager";
import SkedButton from "../SkedButton";
import Divider from "../Divider";

type ListPageSearchBarComponentProps = {
    dataContext: any
    advancedFilterObj: any
    defaultSearchText: string
    jsonDef?: ListPageSearchComponentModel
    onFilterChanged: (searchText:string, dataContext:any) => void
    toggleShowBarVisibility: () => void
    navigationContext: NavigationContext
}

export const ListPageSearchBarComponent : React.FC<ListPageSearchBarComponentProps> = (props) => {

    let { jsonDef,
        dataContext, advancedFilterObj, defaultSearchText,
        onFilterChanged, toggleShowBarVisibility,
        navigationContext } = props

    let transformedDataContext = useMemo(() => {
        return makeObservable({
            ...dataContext,
            filter: advancedFilterObj ?? {}
        }, {
            filter: observable,
            pageData: observable
        })
    }, [dataContext, advancedFilterObj])

    const styleCons = StylesManager.getStyleConst()
    const styles = StylesManager.getStyles()
    const colors = ThemeManager.getColorSet()

    let flatPageContentViewRefFunctions = useRef<FlatPageContentViewRefFunctions>(null)

    if (!jsonDef) {
        // If not defined, do not attempt to render any search bar at all
        return null
    }

    const placeholder = Expressions.getValueFromLocalizedKey({
        expressionStr: jsonDef.placeholder ?? "builtin_search_placeholder",
        dataContext: dataContext
    }) as string

    let searchBarRef = useRef<TextInput>(null)

    let [searchBarText, setSearchBarText] = useState<string>(defaultSearchText)

    let setSearchTxtForAdvancedFilter = (searchText:string) => {
        setSearchBarText(searchText)
    }

    useEffect(() => {
        searchBarRef.current?.focus();
    }, [])

    const renderDefaultSearchBar = () => {
        if (!jsonDef?.filterOnProperties) {
            return <></>
        }

        return (
            <View style={{
                marginTop: styleCons.defaultVerticalPadding,
                marginHorizontal: styleCons.defaultHorizontalPadding,
                marginBottom: styleCons.defaultVerticalPadding,
                justifyContent: "center",
                flexDirection: "row"
            }}>

                <View
                    style={[styles.searchBarTextContainer, {
                        flex: 1,
                        justifyContent: "center",
                        flexDirection: "row"
                    }]}>

                    <Image
                        source={require("../../img/Search_Placeholder.png")}
                        style={{height: 18, width: 18, alignSelf: "center", marginBottom: 2}}/>

                    <TextInput
                        ref={searchBarRef}
                        value={searchBarText}
                        placeholder={placeholder}
                        style={[styles.searchBarText, {flex: 1}]}
                        onChangeText={setSearchTxtForAdvancedFilter}
                        onSubmitEditing={_ => {
                            if (!jsonDef?.advancedFilter) {
                                onFilterChanged(searchBarText, undefined)
                            }
                        }}
                        returnKeyType={"search"}
                    />
                </View>

                <TouchableOpacity
                    onPress={toggleShowBarVisibility}
                    style={{
                        marginLeft: styleCons.defaultHorizontalPadding,
                        alignSelf: "stretch",
                        justifyContent: "center"
                    }}>
                    <Text
                        style={[styles.buttonLinkText, {
                            alignSelf: "center"
                        }]}>{translate("builtin_search_cancel_btn")}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const renderAdvancedFilterIfPossible = () => {
        if (!jsonDef?.advancedFilter?.ui)
            return <></>

        return (
            <View>
                <Divider
                    color={colors.navy100}
                    style={{ marginBottom: styleCons.defaultVerticalPadding }}
                />

                <FlatContentViewRenderer
                    ref={flatPageContentViewRefFunctions}
                    navigationContext={navigationContext}
                    dataContext={transformedDataContext}
                    items={jsonDef.advancedFilter.ui.items}/>
            </View>)
    }

    /* Keep these properties for making animation later */
    // const [scrollContentViewViewHeight, setScrollContentViewViewHeight] = useState(0)
    // const [containerViewHeight, setContainerViewHeight] = useState(0)
    //
    // function onContentViewLayout(event: LayoutChangeEvent) {
    //     setContainerViewHeight(event.nativeEvent.layout.height)
    // }
    //
    // function onScrollViewContentSizeChanged(_: number, h: number) {
    //     setScrollContentViewViewHeight(h)
    // }

    let applyFilter = () => {
        onFilterChanged(searchBarText, transformedDataContext.filter)
    }

    let clearFilter = () => {
        onFilterChanged("", undefined)
    }

    const safeAreaInset = useSafeAreaInsets()

    const keyboardVisible = useKeyboardVisible()

    // We need to define the Height for the SearchBar in order to hide it because we need the "ref" in order to focus on later
    return (
        <View
            style={{
                backgroundColor: colors.white,
                flex: 1,
            }}>

            <ScrollView
                style={{
                    flex: 1,
                }}>

                {renderDefaultSearchBar()}

                {renderAdvancedFilterIfPossible()}
            </ScrollView>

            <View style={{
                flexDirection: "row",
                marginTop: styleCons.defaultVerticalPadding,
                marginHorizontal: styleCons.defaultHorizontalPadding / 2,
                marginBottom: keyboardVisible ? styleCons.defaultVerticalPadding / 2 :  Math.max(safeAreaInset.bottom, styleCons.defaultVerticalPadding / 2),
            }}>
                <View style={{flex: 1, marginRight: styleCons.defaultHorizontalPadding / 2}}>
                    <SkedButton
                        onPress={clearFilter}
                        theme={'default'}
                        textPromiseFn={() => Promise.resolve(translate("builtin_clear"))}/>
                </View>


                <View style={{flex: 1, marginLeft: styleCons.defaultHorizontalPadding / 2}}>
                    <SkedButton
                        onPress={applyFilter}
                        theme={'primary'}
                        textPromiseFn={() => Promise.resolve(translate("builtin_apply_filter"))}/>
                </View>

            </View>

        </View>
    )
}
