import * as React from "react";
import {Text} from "react-native";
import AbstractListPageViewProcessor, {
    ListPageViewArgs
} from "./AbstractListPageViewProcessor";
import {View} from "react-native";
import StylesManager from "../../../StylesManager";
import SkedIcon, {IconTypes} from "../../../../components/SkedIcon";
import Expressions from "../../expression/Expressions";
import MexAsyncText from "../../../../components/MexAsyncText";
import {TitleAndCaptionViewComponentModel} from "@skedulo/mex-types";
import {ContextProxy, CoreContainer, ServicesProxy} from "@skedulo/mex-engine-proxy";

export default class TitleAndCaptionViewProcessor extends AbstractListPageViewProcessor<TitleAndCaptionViewComponentModel> {

    getTypeName(): string {
        return "titleAndCaption";
    }

    generateInnerSublistViewComponent(args: ListPageViewArgs<TitleAndCaptionViewComponentModel>): JSX.Element {
        let styles = StylesManager.getStyles()

        Expressions.scanValueFromDollarSignExpression({expressionStr: args.jsonDef.title, dataContext: args.dataContext})
        Expressions.scanValueFromDollarSignExpression({expressionStr: args.jsonDef.caption, dataContext: args.dataContext})

        const getTitle = async (): Promise<string> => {

            let title = Expressions.getValueFromLocalizedKey({expressionStr: args.jsonDef.title, dataContext: args.dataContext})

            if (title instanceof Promise) {
                return await title
            }

            return title;
        }

        const getCaption = async (): Promise<string> => {
            let caption = Expressions.getValueFromLocalizedKey({expressionStr: args.jsonDef.caption, dataContext: args.dataContext})

            if (caption instanceof Promise) {
                return await caption
            }

            return caption;
        }

        return (
        <View style={{ flexDirection: "row"}}>
            <View style={{flex: 1}}>
                {!args.jsonDef.title || args.jsonDef.title === ""
                    ? null
                    : (<MexAsyncText promiseFn={getTitle}>
                        {(text) => (
                            <Text style={styles.textTitleListItem}>{text ?? ""}</Text>)}
                    </MexAsyncText>)}

                {!args.jsonDef.caption || args.jsonDef.caption === ""
                    ? null
                    : ( <MexAsyncText promiseFn={getCaption}>
                        {(text) => (
                            <Text style={[styles.textCaptionListItem, { marginTop: 8 }]}>
                                {text ?? ""}
                            </Text>)}
                    </MexAsyncText>)}
            </View>

            {args.listPageJsonDef.itemClickDestination ? <SkedIcon style={{
                alignSelf: "center",
                height: 10,
                width: 6
            }} iconType={IconTypes.ChevronRight}/> : null}
        </View>);
    }

    override useObservable() {
        return true;
    }
}