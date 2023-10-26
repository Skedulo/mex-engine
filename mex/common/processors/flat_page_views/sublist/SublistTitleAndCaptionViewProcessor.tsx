import * as React from "react";
import {Text} from "react-native";
import {View} from "react-native";
import AbstractSublistViewProcessor, {SublistPageViewArgs} from "./AbstractSublistViewProcessor";
import StylesManager from "../../../../StylesManager";
import Expressions from "../../../expression/Expressions";
import SkedStaticResourceIcon from "../../../../../components/SkedStaticResourceIcon";
import MexAsyncText from "../../../../../components/MexAsyncText";
import SkedIcon from "../../../../../components/SkedIcon";
import {SublistTitleAndCaptionViewComponentModel} from "@skedulo/mex-types";
import {IconTypes} from "@skedulo/mex-engine-proxy";

export default class SublistTitleAndCaptionViewProcessor extends AbstractSublistViewProcessor<SublistTitleAndCaptionViewComponentModel> {

    getTypeName(): string {
        return "subListTitleAndCaption";
    }

    generateInnerSublistViewComponent(args: SublistPageViewArgs<SublistTitleAndCaptionViewComponentModel>): JSX.Element {

        let styles = StylesManager.getStyles()
        let styleConsts = StylesManager.getStyleConst()

        const getTitle = async (): Promise<string> => {
            if (!args.jsonDef.title || args.jsonDef.title === "")
                return ''

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

        let image = args.jsonDef.image

        return (
            <View style={{ flexDirection: "row"}}>
                {image
                    ? <SkedStaticResourceIcon
                        icon={image.name}
                        style={{
                            marginRight: styleConsts.betweenTextSpacing,
                            height: 40,
                            width: 40
                        }} />
                    : null}

                <View style={{flex: 1}}>
                    {args.jsonDef.title && args.jsonDef.title !== "" ? (<MexAsyncText promiseFn={getTitle}>
                        {(text) => (
                            <Text style={styles.textRegular}>{text}</Text>)}
                    </MexAsyncText>): null }

                    <MexAsyncText promiseFn={getCaption}>
                        {(text) => (
                            <Text style={[styles.textRegular, { marginTop: 5}]}>
                                {text}
                            </Text>)}
                    </MexAsyncText>
                </View>

                <SkedIcon style={{
                    alignSelf: "center",
                    height: 10,
                    width: 6
                }} iconType={IconTypes.ChevronRight}/>
            </View>);
    }

    override useObservable() {
        return true;
    }
}
