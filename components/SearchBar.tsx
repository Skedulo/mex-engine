import * as lodash from "lodash";
import {View} from "react-native";
import SearchRN from "react-native-dynamic-search-bar";
import * as React from "react";
import StylesManager from "../mex/StylesManager";
import ThemeManager from "../mex/colors/ThemeManager";
import {useState} from "react";
import {SearchBarProps} from "@skedulo/mex-engine-proxy";

const SearchBar = ({placeholder = '', onChangeText, style}: SearchBarProps) => {
    let styleConst = StylesManager.getStyleConst()
    let colors = ThemeManager.getColorSet()
    const [searchText, setSearchText] = useState("");

    let searchDebounceFunc = lodash.debounce((searchText) => {
        onChangeText(searchText);
    }, 500);

    return (
        <View style={[style ?? {}, {
            paddingLeft: styleConst.defaultHorizontalPadding,
            paddingRight: styleConst.defaultHorizontalPadding,
        }]}>
            <SearchRN
                style={{
                    height: 40,
                    width: "100%",
                    marginTop: styleConst.defaultVerticalPadding,
                    paddingHorizontal: 0,
                    shadowOpacity: 0.0,
                    borderColor: colors.skeduloBlue,
                    borderWidth: 0.5,
                    backgroundColor: colors.skeduloBackgroundGrey
                }}
                searchIconImageStyle={{
                    tintColor: colors.skeduloPlaceholder
                }}
                clearButtonMode="never"
                returnKeyType="search"
                clearIconImageStyle={{
                    tintColor: colors.skeduloPlaceholder,
                    opacity: searchText.length > 0 ? 1 : 0.0
                }}
                textInputStyle={{
                    color: colors.skeduloText,
                }}
                spinnerColor={colors.skeduloPlaceholder}
                placeholderTextColor={colors.skeduloPlaceholder}
                placeholder={placeholder}
                onChangeText={(text) => {
                    searchDebounceFunc(text)
                    setSearchText(text)
                }}
                onClearPress={() => {
                    searchDebounceFunc("")
                }}
                autoFocus
            />
        </View>
    )
}

export default SearchBar;
