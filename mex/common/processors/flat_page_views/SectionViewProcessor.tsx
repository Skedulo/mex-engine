import * as React from "react";
import {Text} from "react-native";
import {View} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import MexAsyncText from "../../../../components/MexAsyncText";
import FlatPageViewProcessorsManager from "./FlatPageViewProcessorsManager";
import ThemeManager from "../../../colors/ThemeManager";
import {AbstractFlatPageViewProcessor, FlatPageViewArgs, FlatPageViewProps} from "@skedulo/mex-engine-proxy";
import {BaseComponentModel, SectionViewComponentModel} from "@skedulo/mex-types";

type SectionPageViewProps = FlatPageViewProps<SectionPageViewArgs, SectionViewComponentModel>

type SectionPageViewArgs = FlatPageViewArgs<SectionViewComponentModel> & {
    showDivider : boolean
}

export default class SectionViewProcessor extends AbstractFlatPageViewProcessor<
    SectionPageViewProps,
    SectionPageViewArgs,
    SectionViewComponentModel>{

    generateInnerComponent(args: SectionPageViewArgs): JSX.Element {
        let { jsonDef, dataContext } = args

        let showIfValue = super.checkVisibility(args)

        if (!showIfValue) {
            return (<></>)
        }

        let childItemsDef = jsonDef.items

        let styles = StylesManager.getStyles()
        let styleConst = StylesManager.getStyleConst()
        let colors = ThemeManager.getColorSet()

        let title = args.jsonDef.title
        let body = args.jsonDef.body
        let caption = args.jsonDef.caption

        let hasSectionHeader = title || body || caption;
        return (
            <View style={{ flexDirection: "column"}}>
                <View style={{ flex: 1 }}>
                    {hasSectionHeader ? (<View style={{paddingBottom: styleConst.componentVerticalPadding}}>
                        {title ? <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({expressionStr: title, dataContext: args.dataContext})}>
                            {(text) => (
                                <Text style={[
                                    styles.textHeadingBold,
                                    {
                                        flex: 1,
                                        paddingHorizontal: styleConst.defaultHorizontalPadding,
                                    }
                                ]}>{text}</Text>
                            )}
                        </MexAsyncText> : null}

                        {body ? <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({expressionStr: body, dataContext: args.dataContext})}>
                            {(text) => (
                                <Text style={[
                                    styles.textRegular,
                                    {
                                        flex: 1,
                                        marginTop: styleConst.smallVerticalPadding,
                                        paddingHorizontal: styleConst.defaultHorizontalPadding}
                                ]}>{text}</Text>
                            )}
                        </MexAsyncText> : null}

                        {caption ? <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({expressionStr: caption, dataContext: args.dataContext})}>
                            {(text) => (
                                <Text style={[
                                    styles.textCaption,
                                    {
                                        flex: 1,
                                        marginTop: styleConst.smallVerticalPadding,
                                        paddingHorizontal: styleConst.defaultHorizontalPadding
                                    }
                                ]}>{text}</Text>
                            )}
                        </MexAsyncText> : null}
                    </View>) : null}

                    {!childItemsDef ? null : childItemsDef.map((childItemDef: BaseComponentModel, index: number) => {
                        let processor = FlatPageViewProcessorsManager.findProcessor(childItemDef.type)

                        if (!processor) {
                            return (
                                <View
                                    key={index}>
                                    <Text>Can't find corresponding component with type {childItemDef.type} in FlatPageViewProcessorsManager</Text>
                                </View>)
                        } else {
                            let FlatPageComp = processor.generateComponent();

                            let childArgs:any = {
                                jsonDef: childItemDef,
                                dataContext,
                                navigationContext: args.navigationContext
                            }

                            // @ts-ignore
                            return (
                                <View
                                    style={{marginHorizontal: styleConst.defaultHorizontalPadding, marginBottom: processor.checkVisibility(childArgs) ? styleConst.betweenComponentVerticalSpacing : 0}}
                                    key={index}>
                                    <FlatPageComp
                                        args={childArgs}/>
                                </View>)
                        }
                    })}

                    {!args.showDivider ? null :
                        <View style={{flex: 1, height: 10, backgroundColor: colors.navy10, marginBottom: styleConst.defaultVerticalPadding }}/>
                    }
                </View>
            </View>);
    }

    override useObservable() {
        return true;
    }

    override isFullWidthLayout(): boolean {
        return true
    }

    override hasTopMargin(): boolean {
        return false
    }

    getTypeName(): string {
        return "section";
    }
}
