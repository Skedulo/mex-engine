import React, {FC, useContext, useMemo} from 'react'
import {AddNewButtonData, ListPageComponentModel, ButtonGroupItemComponentModel} from "@skedulo/mex-types";
import NavigationProcessManager, {NavigationContext} from "../../mex/common/NavigationProcessManager";
import StylesManager from "../../mex/StylesManager";
import ThemeManager from "../../mex/colors/ThemeManager";
import Expressions from "../../mex/common/expression/Expressions";
import {BehaviorManager} from "../../mex/common/processors/ButtonBehaviorManager";
import {StyleSheet, Text, View} from "react-native";
import SkedButton from "../SkedButton";
import MexAsyncText from "../MexAsyncText";
import Divider from "../Divider";
import InternalUtils from "../../mex/common/InternalUtils";
import {PageProcessorContext, PageProcessorContextObj} from "../../mex/hooks/useCrudOnPage";
import {SkedButtonSize} from "@skedulo/mex-engine-proxy";
import {toJS} from "mobx";

type ListPageHeaderComponentProps = {
    jsonDef: ListPageComponentModel,
    dataContext: any,
    navigationContext: NavigationContext
}

type ListPageHeaderButton = {
    type: 'addNew' | 'other'
    data: AddNewButtonData | ButtonGroupItemComponentModel
}

export const ListPageHeaderComponent : FC<ListPageHeaderComponentProps> = (props) => {
    const { jsonDef, dataContext, navigationContext } = props
    const { headerTitle, headerDescription, addNew, buttonGroup } = jsonDef
    const styles = StylesManager.getStyles()
    const colors = ThemeManager.getColorSet()
    const behaviorManager = useMemo(() => new BehaviorManager(), [])

    const pageContext = useContext<PageProcessorContextObj|undefined>(PageProcessorContext)

    // we will combine "addNew" button and other buttons in "buttonGroup" into a new button array
    const buttonArray = useMemo(() => {
        let buttons = []
        if (addNew) {
            const showIfValue = addNew.showIfExpression ? Expressions.getValueExpression({ expressionStr: addNew.showIfExpression, dataContext }) : true
            if (showIfValue) {
                buttons.push({
                    type: 'addNew',
                    data: addNew
                })
            }
        }

        buttonGroup?.items?.forEach((item: ButtonGroupItemComponentModel) => {
            buttons.push({
                type: 'other',
                data: item
            })
        })
        return buttons
    },[dataContext])

    const onAddButtonClicked = async () => {
        if (!jsonDef.addNew) {
            return
        }

        let newNavigationContext = new NavigationContext()

        newNavigationContext.sourceExpression = jsonDef.sourceExpression
        newNavigationContext.prevPageNavigationContext = navigationContext

        await NavigationProcessManager.navigate(
            jsonDef.addNew.destinationPage,
            InternalUtils.data.createTempObject(jsonDef.addNew.defaultData, dataContext),
            newNavigationContext,
            dataContext)
    }

    const renderButton = (buttonData: ListPageHeaderButton, isRightButton = false) => {
        // addNew button
        if (buttonData.type === 'addNew') {
            return (
                <SkedButton
                    onPress={onAddButtonClicked}
                    textPromiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                        expressionStr: addNew.text,
                        dataContext: dataContext
                    })}
                    size={isRightButton ? SkedButtonSize.SMALL : SkedButtonSize.LARGE}
                />
            )
        }

        // other button
        const buttonGroupItemData = buttonData.data as ButtonGroupItemComponentModel
        const disabled = InternalUtils.data.getBooleanExpressionGenericValue(buttonGroupItemData.disabled, toJS(dataContext))
        const onPressCallback = () => {
            const behavior = behaviorManager.findProcessor(buttonGroupItemData.behavior.type)
            behavior?.execute({
                jsonDef: buttonGroupItemData.behavior,
                dataContext: dataContext,
                pageContext
            })
        }

        return (
            <SkedButton
                disabled={disabled}
                onPress={onPressCallback}
                theme={buttonGroupItemData.theme!}
                textPromiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({dataContext, expressionStr: buttonData.data.text})}
                size={isRightButton ? SkedButtonSize.SMALL : SkedButtonSize.LARGE}
            />
        )
    }

    return (
        <View style={componentStyles.container}>
            <View style={[componentStyles.titleRowContainer, { marginBottom: headerTitle ? 16 : 0 }]}>
                {!!headerTitle && (
                    <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                        expressionStr: headerTitle,
                        dataContext: dataContext
                    })}>
                        {(text) => (
                            <Text style={[styles.textHeadingBold, componentStyles.textTitle]}>
                                {text}
                            </Text>)}
                    </MexAsyncText>
                )}

                {/*If there is only 1 button and title, the button will be shown on the right side of the title.*/}
                {!!headerTitle && buttonArray.length === 1 && renderButton(buttonArray[0] as ListPageHeaderButton, true)}
            </View>

            {!!headerDescription && (
                <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                    expressionStr: headerDescription,
                    dataContext: dataContext
                })}>
                    {(text) => (
                        <Text style={[styles.textRegular, { marginBottom: 16, marginHorizontal: 16 }]}>
                            {text}
                        </Text>)
                    }
                </MexAsyncText>)
            }

            {/*If there is 2 or more buttons or there is no title, each button will be placed per row.*/}
            {(buttonArray.length > 1 || !headerTitle) && buttonArray.map((data, index) => {
                return (
                    <View style={[componentStyles.verticalListButtonContainer]} key={index}>
                        {renderButton(data as ListPageHeaderButton, false)}
                    </View>
                )
            })}

            {(!!headerTitle || !!headerDescription || buttonArray.length > 0)
                && <Divider color={colors.navy100}/>
            }
        </View>)
}

const componentStyles = StyleSheet.create({
    container: {
        paddingTop: StylesManager.getStyleConst().defaultVerticalPadding,
        backgroundColor: ThemeManager.getColorSet().white,
    },
    verticalListButtonContainer: {
        marginBottom: 16,
        marginHorizontal: 16,
    },
    titleRowContainer: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    textTitle: {
        marginRight: 8,
        flex: 1,
    }
})
