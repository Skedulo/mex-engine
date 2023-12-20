import * as React from "react";
import {Text, View} from "react-native";
import MexAsyncText from "../../../../../components/MexAsyncText";
import Expressions from "../../../expression/Expressions";
import StylesManager from "../../../../StylesManager";
import {AbstractFlatPageViewProcessor, FlatPageViewArgs, FlatPageViewProps} from "@skedulo/mex-engine-proxy";
import ProfileImage from "../../../../../components/ProfileImage";
import ContactMethodViews from "../../../../../components/ContactMethodViews";
import {ContactDetailsLayoutComponentModel} from "@skedulo/mex-types";

type ContactDetailsLayoutProps = FlatPageViewProps<ContactDetailsLayoutArgs, ContactDetailsLayoutComponentModel>

type ContactDetailsLayoutArgs = FlatPageViewArgs<ContactDetailsLayoutComponentModel> & {
}

export default class ContactDetailsLayoutProcessor extends AbstractFlatPageViewProcessor<ContactDetailsLayoutProps, ContactDetailsLayoutArgs, ContactDetailsLayoutComponentModel> {

    generateInnerComponent(args: ContactDetailsLayoutArgs): JSX.Element {
        let { jsonDef, dataContext } = args

        let showIfValue = super.checkVisibility(args)

        if (!showIfValue) {
            return (<></>)
        }

        let styleConst = StylesManager.getStyleConst()

        let profileName:string|undefined
        let profileUrl:string|undefined

        if (args.jsonDef.profileImage) {
            profileName = args.jsonDef.profileImage.nameExpression ? Expressions.getValueExpression({expressionStr: args.jsonDef.profileImage.nameExpression, dataContext: dataContext}) : undefined
            profileUrl = args.jsonDef.profileImage.urlExpression ? Expressions.getValueExpression({expressionStr: args.jsonDef.profileImage.urlExpression, dataContext: dataContext}) : undefined
        }

        return (
            <View style={{flexDirection: "row"}}>
                {jsonDef.profileImage
                    ? (<ProfileImage
                        style={{width: 100, height: 100}}
                        name={profileName}
                        url={profileUrl}/>)
                    : null}

                <View style={{flexDirection: "column", marginLeft: styleConst.defaultHorizontalPadding}}>
                    <View style={{flex: 1, marginBottom: styleConst.defaultVerticalPadding}}>

                        {args.jsonDef.title
                            ? <MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                                dataContext: args.dataContext,
                                expressionStr: args.jsonDef.title
                            })}>
                                {(text) => (
                                    <Text style={[StylesManager.getStyles().textMedium]}>{text}</Text>
                                )}
                            </MexAsyncText>
                            : null}

                        {args.jsonDef.caption
                            ? <MexAsyncText
                                promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
                                    dataContext: args.dataContext,
                                    expressionStr: args.jsonDef.caption
                                })}>
                                {(text) => (
                                    <Text style={[StylesManager.getStyles().textCaption, {marginTop: styleConst.betweenTextSpacing}]}>{text}</Text>
                                )}
                            </MexAsyncText>
                            : null}
                    </View>

                    <ContactMethodViews
                        dataContext={dataContext}
                        methods={args.jsonDef.contactMethods}/>
                </View>
            </View>);
    }

    override hasTopMargin(): boolean {
        return false
    }

    getTypeName(): string {
        return "contactDetailsLayout";
    }
}
