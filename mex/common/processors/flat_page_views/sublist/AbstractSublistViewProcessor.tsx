import {AbstractProcessor, StandardComponentArgs, StandardComponentProps} from "@skedulo/mex-engine-proxy";
import {View} from "react-native";
import * as React from "react";
import InvalidBadge from "../../../../../components/InvalidBadge";
import StylesManager from "../../../../StylesManager";
import Divider from "../../../../../components/Divider";
import {BaseSublistViewComponentModel} from "@skedulo/mex-types";

export type SublistPageViewProps<TComponentDefinitionModel extends BaseSublistViewComponentModel> = StandardComponentProps<SublistPageViewArgs<TComponentDefinitionModel>, TComponentDefinitionModel>

export type SublistPageViewArgs<TComponentDefinitionModel extends BaseSublistViewComponentModel>  = StandardComponentArgs<TComponentDefinitionModel> & {
}

abstract class AbstractSublistViewProcessor<TComponentDefinitionModel extends BaseSublistViewComponentModel>
    extends AbstractProcessor<
        SublistPageViewProps<TComponentDefinitionModel>,
        SublistPageViewArgs<TComponentDefinitionModel>,
        TComponentDefinitionModel> {

    generateInnerComponent(args: SublistPageViewArgs<TComponentDefinitionModel>): JSX.Element {

        let styleConsts = StylesManager.getStyleConst()

        let itemContext = args.dataContext.item

        return (
            <View style={{alignContent: "flex-start"}}>
                {this.generateInnerSublistViewComponent(args)}

                <InvalidBadge dataContext={itemContext}></InvalidBadge>

                <Divider style={{marginTop: styleConsts.betweenTextSpacing}} />
            </View>);
    }

    abstract generateInnerSublistViewComponent(args: SublistPageViewArgs<TComponentDefinitionModel>): JSX.Element;

}

export default AbstractSublistViewProcessor

