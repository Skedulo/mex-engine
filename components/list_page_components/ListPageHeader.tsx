import React, {useContext, useMemo} from 'react'
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

type ListPageHeaderComponentProps = {
    jsonDef: ListPageComponentModel,
    dataContext: any,
    navigationContext: NavigationContext
}

type ListPageHeaderButton = {
    type: 'addNew' | 'other'
    data: AddNewButtonData | ButtonGroupItemComponentModel
}

export const ListPageHeaderComponent : React.FC<ListPageHeaderComponentProps> = (props) => {
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

    const getHeaderTitle = async (): Promise<string> => {
        if (!headerTitle) {
            return ""
        }

        const result = Expressions.getValueFromLocalizedKey({expressionStr: headerTitle, dataContext: dataContext})

        if (result instanceof Promise) {
            return await result
        }

        return result;
    }

    const getHeaderDescription = async (): Promise<string> => {
        if (!headerDescription) {
            return ""
        }

        const result = Expressions.getValueFromLocalizedKey({expressionStr: headerDescription, dataContext: dataContext})

        if (result instanceof Promise) {
            return await result
        }

        return result;
    }

    const getAddButtonText = async (): Promise<string> => {
        let getAddButtonText = Expressions.getValueFromLocalizedKey({
            expressionStr: addNew.text,
            dataContext: dataContext
        })

        if (getAddButtonText instanceof Promise) {
            return await getAddButtonText
        }

        return getAddButtonText;
    }

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
                    textPromiseFn={getAddButtonText}
                    size={isRightButton ? SkedButtonSize.SMALL : SkedButtonSize.LARGE}
                />
            )
        }

        // other button
        const buttonGroupItemData = buttonData.data as ButtonGroupItemComponentModel
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
                    <MexAsyncText promiseFn={getHeaderTitle}>
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
                <MexAsyncText promiseFn={getHeaderDescription}>
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
        marginHorizontal: 16,
    },
    textTitle: {
        marginRight: 8,
        flex: 1,
    }
})
