import {UseAttachments} from "@skedulo/mex-types";
import {useEffect, useReducer, useRef} from "react";
import {AttachmentMetadata} from "../../mex-engine-proxy/src";
import lodash from "lodash";
import AttachmentsManager from "../mex/common/attachments/AttachmentsManager";
import {View} from "react-native";
import SkeduloImage from "./SkeduloImage";
import * as React from "react";

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

export const AttachmentsView = (props: AttachmentsViewProps) => {
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
