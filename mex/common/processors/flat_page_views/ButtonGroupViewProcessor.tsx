import * as React from "react";
import {StyleProp, View, ViewStyle} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import {AbstractFlatPageViewProcessor, FlatPageViewArgs, FlatPageViewProps} from "@skedulo/mex-engine-proxy";
import SkedButton from "../../../../components/SkedButton";
import {useContext, useMemo} from "react";
import {BehaviorManager} from "../ButtonBehaviorManager";
import {ButtonGroupItemComponentModel, ButtonGroupViewComponentModel} from "@skedulo/mex-types";
import {PageProcessorContext, PageProcessorContextObj} from "../../../hooks/useCrudOnPage";
import InternalUtils from "../../InternalUtils";

type ButtonGroupViewProps = FlatPageViewProps<ButtonGroupViewArgs, ButtonGroupViewComponentModel>

type ButtonGroupViewArgs = FlatPageViewArgs<ButtonGroupViewComponentModel> & {
}

export default class ButtonGroupViewProcessor extends AbstractFlatPageViewProcessor<ButtonGroupViewProps, ButtonGroupViewArgs, ButtonGroupViewComponentModel> {

    override useObservable(): boolean {
        return true
    }

    getTypeName(): string {
        return "buttonGroup";
    }

    generateInnerComponent(args: ButtonGroupViewArgs): JSX.Element {
        let items = args.jsonDef.items
        let dataContext = args.dataContext

        let styleCons = StylesManager.getStyleConst();

        let pageContext = useContext<PageProcessorContextObj|undefined>(PageProcessorContext)
        let behaviorManager = useMemo(() => new BehaviorManager(), [])

        let renderButton = (item: ButtonGroupItemComponentModel, style?: StyleProp<ViewStyle>, index?: any) => {
            let onPressCallback = () => {
                let behavior = behaviorManager.findProcessor(item.behavior.type)

                behavior?.execute({
                    jsonDef: item.behavior,
                    dataContext: dataContext,
                    pageContext: pageContext
                })
            }

            const disabled = InternalUtils.data.getBooleanExpressionGenericValue(item.disabled, dataContext)

            return (
                <View style={[{flex: 1}, style]} key={index}>
                    <SkedButton
                        disabled={disabled}
                        onPress={onPressCallback}
                        theme={item.theme}
                        textPromiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({dataContext: args.dataContext, expressionStr: item.text})} />
                </View>)
        }

        if (!this.checkVisibility(args)) {
            return (<></>)
        }

        if (items.length === 1) {
            return renderButton(items[0]);
        } else if (items.length === 2) {
            return (
                <View style={{ flexDirection: 'row' }}>
                    {renderButton(items[0], {marginRight: styleCons.defaultHorizontalPadding})}
                    {renderButton(items[1])}
                </View>
            );
        } else {
            return (
            <View>
                {items.map((data, i) => {
                    return renderButton(data, { marginBottom: styleCons.defaultVerticalPadding }, i)
                })}
            </View>);
        }
    }
}

