import * as React from "react";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import {Text, TouchableOpacity, View} from "react-native";
import MexAsyncText from "../../../../components/MexAsyncText";
import {useCallback} from "react";
import {CheckBox} from "../../../../components/CheckBox";
import {RadioButton} from "../../../../components/RadioButton";
import {SelectPageConfig} from "@skedulo/mex-types";

type SelectScreenRowProps = {
    dataContext: any
    selectPageConfig: SelectPageConfig
    item: any
    onItemSelected: (item:any) => void
    isSelected: boolean
}

const SelectScreenRow : React.FC<SelectScreenRowProps> = (props: SelectScreenRowProps) => {

    let {selectPageConfig, item, onItemSelected, dataContext, isSelected} = props

    let styles = StylesManager.getStyles()
    let styleConst = StylesManager.getStyleConst()

    const renderContentElement = function () {

        let getItemTitle = async (): Promise<string> => {
            if (!selectPageConfig.itemTitle) {
                return ""
            }

            let itemTitle = Expressions.getValueFromLocalizedKey({
                expressionStr: selectPageConfig.itemTitle,
                dataContext: {...dataContext, item},
            })

            if (itemTitle instanceof Promise) {
                return await itemTitle
            }

            return itemTitle;
        }

        let getItemCaption = async (): Promise<string> => {
            if (!selectPageConfig.itemCaption) {
                return ""
            }

            let itemCaption = Expressions.getValueFromLocalizedKey({
                expressionStr: selectPageConfig.itemCaption,
                dataContext: {...dataContext, item},
            })

            if (itemCaption instanceof Promise) {
                return await itemCaption
            }

            return itemCaption;
        }

        return (<View style={{marginHorizontal: 10, justifyContent: "center", flex: 1}}>
            <MexAsyncText promiseFn={getItemTitle}>
                {(text) => (
                    <Text style={[
                        styles.textRegular,
                        {
                            textAlignVertical: "center"
                        }
                    ]}>{text}</Text>
                )}
            </MexAsyncText>

            <MexAsyncText promiseFn={getItemCaption}>
                {(text) => {
                    return (text.length > 0 ?
                        <Text style={[
                            styles.textRegular,
                            {
                                textAlignVertical: "center",
                                marginTop: styleConst.betweenTextSpacing,
                                fontSize: styleConst.captionTextSize
                            }
                        ]}>{text}</Text> : null)
                }}
            </MexAsyncText>
        </View>)
    }

    let onItemSelectedInternal = useCallback(() => {
        onItemSelected(item)
    }, [item])
    return (
        <TouchableOpacity
            onPress={onItemSelectedInternal}>
            <View style={{
                flexDirection: "row",
                alignItems: "stretch",
                marginVertical: styleConst.componentVerticalPadding
            }}>
                {selectPageConfig.singleSelectionConfig?.dismissPageAfterChosen ? null : (
                    <View style={{marginLeft: 10, alignItems: 'center', justifyContent: 'center'}}>
                        {selectPageConfig.isMultiSelect ? (
                            <CheckBox readonly={false} isChecked={isSelected} handleOnPress={onItemSelectedInternal} disableText />
                        ) : (
                            <RadioButton readonly={false} isChecked={isSelected} handleOnPress={onItemSelectedInternal} disableText />
                        )}
                    </View>)}
                <View style={{flex: 1, alignSelf: "stretch"}}>
                    {renderContentElement()}
                </View>

            </View>
        </TouchableOpacity>
    )
}

export function areEqual(prevProps:SelectScreenRowProps, nextProps:SelectScreenRowProps) {
    let sameSelected = prevProps.isSelected === nextProps.isSelected

    return sameSelected  && areItemEqual(prevProps.item, nextProps.item)
}

export function areItemEqual(prevItem:any, nextItem: any) {
    if (typeof prevItem === 'object' && typeof nextItem === 'object') {
        if (prevItem.UID && nextItem.UID) {
            // Retrieve UID if they are both objects
            return prevItem.UID === nextItem.UID
        }
        else if (prevItem.Value && nextItem.Value) {
            // In this case, both was an object from Vocab
            return prevItem.Value === nextItem.Value
        }
    }
    // Otherwise compare them as pure value
    return prevItem === nextItem
}

const SelectScreenRowMemo = React.memo(SelectScreenRow, areEqual)

export default SelectScreenRowMemo
