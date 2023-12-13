import {AbstractProcessor, ListPageViewArgs, ListPageViewProps} from "@skedulo/mex-engine-proxy";
import {View} from "react-native";
import Divider from "../../../../components/Divider";
import * as React from "react";
import {SublistPageViewArgs} from "../flat_page_views/sublist/AbstractSublistViewProcessor";
import InvalidBadge from "../../../../components/InvalidBadge";
import {useCallback} from "react";
import StylesManager from "../../../StylesManager";
import TagsView from "../../../../components/TagsView";
import {BaseListPageViewComponentModel} from "@skedulo/mex-types";
import {AttachmentsView} from "../../../../components/AttachmentsView";

abstract class AbstractListPageViewWithAttachmentsProcessor<TComponentDefinitionModel extends BaseListPageViewComponentModel>
    extends AbstractProcessor<
        ListPageViewProps<TComponentDefinitionModel>,
        ListPageViewArgs<TComponentDefinitionModel>,
        TComponentDefinitionModel> {

    generateInnerComponent(args: ListPageViewArgs<TComponentDefinitionModel>): JSX.Element {

        let itemContext = args.dataContext.item

        let styleConsts = StylesManager.getStyleConst()

        let renderTagsComponent = useCallback(() => {

            if (!args.jsonDef.tags) {
                return <></>
            }

            return <TagsView dataContext={args.dataContext} uiDef={args.jsonDef.tags} />

        }, [itemContext]);

        let renderSublistViewComponent = useCallback(() => {
            if (!args.jsonDef.useAttachments) {
                return (
                    <View>
                        {this.generateInnerSublistViewComponent(args)}

                        {renderTagsComponent()}
                    </View>
                )
            }

            let style = args.jsonDef.useAttachments.style ?? 'singleBig'

            if (style === 'singleBig') {
                return (
                    <View>
                        {this.generateInnerSublistViewComponent(args)}

                        {renderTagsComponent()}

                        <AttachmentsView
                            styles={{
                                aspectRatio: 16/9,
                                borderRadius: 10,
                                marginTop: styleConsts.componentVerticalPadding
                            }}
                            dataContext={args.dataContext}
                            jsonDef={args.jsonDef.useAttachments}/>
                    </View>)
            }
            else {
                return (
                    <View style={{ flexDirection: "row"}}>
                        <AttachmentsView
                            styles={{
                                aspectRatio: 5/6,
                                borderRadius: 0,
                                width: 80,
                                marginRight: styleConsts.defaultHorizontalPadding
                            }}
                            dataContext={args.dataContext}
                            jsonDef={args.jsonDef.useAttachments}/>
                        <View style={{flex: 1}}>
                            {this.generateInnerSublistViewComponent(args)}

                            {renderTagsComponent()}
                        </View>
                    </View>)
            }
        }, [itemContext])

        return (
            <View style={{paddingHorizontal: 16, paddingTop: 18, alignContent: "flex-start"}}>
                {renderSublistViewComponent()}

                <InvalidBadge dataContext={itemContext}/>

                <Divider style={{marginTop: 18}} />
            </View>);
    }

    abstract generateInnerSublistViewComponent(args: SublistPageViewArgs<TComponentDefinitionModel>): JSX.Element;
}

export default AbstractListPageViewWithAttachmentsProcessor
