import AbstractProcessor, {StandardComponentArgs, StandardComponentProps} from "../AbstractProcessor";
import {View} from "react-native";
import Divider from "../../../../components/Divider";
import * as React from "react";
import {SublistPageViewArgs} from "../flat_page_views/sublist/AbstractSublistViewProcessor";
import InvalidBadge from "../../../../components/InvalidBadge";
import {useCallback, useEffect, useReducer, useRef} from "react";
import StylesManager from "../../../StylesManager";
import lodash from "lodash";
import AttachmentsManager from "../../attachments/AttachmentsManager";
import SkeduloImage from "../../../../components/SkeduloImage";
import TagsView from "../../../../components/TagsView";
import {BaseListPageViewComponentModel, ListPageComponentModel, UseAttachments} from "@skedulo/mex-types";
import {AttachmentMetadata} from "@skedulo/mex-engine-proxy";

export type ListPageViewProps<TComponentDefinitionModel extends BaseListPageViewComponentModel> = StandardComponentProps<ListPageViewArgs<TComponentDefinitionModel>, TComponentDefinitionModel>

export type ListPageViewArgs<TComponentDefinitionModel extends BaseListPageViewComponentModel>  = StandardComponentArgs<TComponentDefinitionModel> & {
    listPageJsonDef: ListPageComponentModel
}

abstract class AbstractListPageViewProcessor<TComponentDefinitionModel extends BaseListPageViewComponentModel>
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


type AttachmentsViewProps = {
    dataContext: any,
    jsonDef: UseAttachments,
    styles?: AttachmentsStyle
}

type AttachmentsStyle = {
    borderRadius?: number,
    aspectRatio?: number,
    width?: number,
    marginRight?: number,
    marginTop?: number,
}

let AttachmentsView = (props: AttachmentsViewProps) => {
    let dataContext = props.dataContext
    let { jsonDef, styles } = props

    const [, forceUpdate] = useReducer(x => x + 1, 0);

    let attachmentsMetadata = useRef<AttachmentMetadata[]>([])
    let attachmentsRef = useRef()

    // subscribe for changes
    useEffect(() => {

        let getAttachmentsDebounce = lodash.throttle(function(attachments: AttachmentMetadata[]) {
            attachmentsMetadata.current = attachments;

            forceUpdate();
        }, 500, {'leading': false})

        AttachmentsManager.observeAttachmentsChangeForContext(attachmentsRef, dataContext.item.UID, "ATTACHMENT", jsonDef.categoryName ?? "", getAttachmentsDebounce);

        return () => {
            AttachmentsManager.unsubscribeAttachmentsChangeForContext(attachmentsRef, dataContext.item.UID, "ATTACHMENT", jsonDef.categoryName ?? "")
        }
    }, [])

    if (attachmentsMetadata.current.length == 0) {
        return <></>
    }

    let item = attachmentsMetadata.current
        .sort((a: AttachmentMetadata, b:AttachmentMetadata) => a.uploadDate < b.uploadDate ? 1 : -1)[0]

    let finalUrl = item.localFileURL ?? item.downloadURL;

    return (
    <View style={[{
        borderRadius: 10,
        aspectRatio: 16 / 9,
    }, styles ?? {}]}>
        <SkeduloImage
            style={{
                height: "100%",
                width: "100%",
            }}
            imageStyles={{
                borderRadius: styles?.borderRadius ?? undefined
            }}
            uri={finalUrl}/>
    </View>)
}


export default AbstractListPageViewProcessor
