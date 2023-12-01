import {Platform, Text, TextInput, TextStyle, TouchableOpacity, View} from "react-native";
import MexAsyncText from "../MexAsyncText";
import StylesManager from "../../mex/StylesManager";
import ThemeManager from "../../mex/colors/ThemeManager";
import ErrorTextWithRef from "../ErrorText";
import FilesView from "../FilesView";
import * as React from "react";
import {
    AttachmentMetadata,
    AttachmentsEditorViewProps,
    ExpressionArgs,
    TextEditorViewProps
} from "@skedulo/mex-engine-proxy";
import {ForwardedRef, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState} from "react";
import {ReadonlyText} from "../ReadonlyText";
import BottomSheet from "../../mex/common/plugins/BottomSheet";
import {ImagePickerResponse, launchCamera, launchImageLibrary} from "react-native-image-picker";
import {makeAutoObservable, runInAction} from "mobx";
import AttachmentsManager from "../../mex/common/attachments/AttachmentsManager";
import utils from "../../mex/common/Utils";
import {PageProcessorContext, PageProcessorContextObj} from "../../mex/hooks/useCrudOnPage";
import Expression from "../../mex/common/expression/Expressions";
import lodash from "lodash";
import Expressions from "../../mex/common/expression/Expressions";
import {translate} from "../../mex/assets/LocalizationManager";

export const AttachmentsEditorView = React.forwardRef((props: AttachmentsEditorViewProps, inputRef: ForwardedRef<any>) => {

    let  { title, readonly, parentId, attachmentCategoryName, onAttachmentsChanged } = props

    const attachmentRef = useRef()

    let pageContext = useContext<PageProcessorContextObj|undefined>(PageProcessorContext)
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    let attachmentsMetadata = useRef<AttachmentMetadata[]>([])

    // subscribe for changes
    useEffect(() => {

        let getAttachmentsDebounce = lodash.throttle(function(attachments: AttachmentMetadata[]) {
            attachmentsMetadata.current = attachments;

            if (onAttachmentsChanged) {
                onAttachmentsChanged(attachments)
            }

            forceUpdate();
        }, 500, {'leading': false})


        AttachmentsManager.observeAttachmentsChangeForContext(attachmentRef, parentId, "ATTACHMENT", attachmentCategoryName, getAttachmentsDebounce);

        return () => {
            AttachmentsManager.unsubscribeAttachmentsChangeForContext(attachmentRef, parentId, "ATTACHMENT", attachmentCategoryName)
        }
    }, [])

    let addAttachmentRequests:any[] = []

    let addAttachment = (response: ImagePickerResponse) => {
        if (!response || !response.assets) {
            return
        }

        response.assets.forEach((asset:any) => {

            let uid = utils.data.generateUniqSerial('local')

            addAttachmentRequests.push({
                uid: uid,
                uri: asset.uri
            })
        })

        AttachmentsManager.addAttachments(addAttachmentRequests, parentId, attachmentCategoryName)
    }

    let showPickFileBottomSheet = function() {
        BottomSheet.showBottomSheetWithOptions({
            options: [translate('builtin_camera'), translate('builtin_photo_library'), translate('builtin_cancel')],
            cancelButtonIndex: 2,
        }, async (chosenIndex) => {
            if (chosenIndex === 1) {
                launchImageLibrary({
                    mediaType: "mixed",
                    maxHeight: 1920,
                    maxWidth: 1080,
                    quality: 0.5,
                    selectionLimit: 0,
                    videoQuality: "medium"
                }).then(response => {
                    runInAction(() => {
                        addAttachment(response)
                    })
                })
            }

            if (chosenIndex === 0) {
                let attachmentSettings = await AttachmentsManager.getAttachmentSettings()
                const resultPermission = await utils.permission.requestCameraPermission()

                if (resultPermission) {
                    launchCamera({
                        mediaType: "photo",
                        cameraType: "back",
                        maxHeight: 1920,
                        maxWidth: 1080,
                        quality: 0.5,
                        saveToPhotos: attachmentSettings.saveOriginalPhotos
                    }).then(response => {
                        addAttachment(response)
                    })
                }
            }
        });
    }
    let attachmentsMetadataSource = attachmentsMetadata.current

    return (
        <View ref={inputRef}>
            <View style={{flexDirection: "row", alignItems: 'center'}}>
                <Text style={[StylesManager.getStyles().textHeadingBold, {flex: 1}]}>{title}</Text>

                {!readonly ? (<TouchableOpacity
                    onPress={showPickFileBottomSheet}
                    style={{alignSelf: 'center'}}>
                    <Text style={{
                        color: ThemeManager.getColorSet().skeduloBlue,
                        fontSize: 18
                    }}>Add</Text>
                </TouchableOpacity>) : null}
            </View>

            <FilesView readonly={readonly} attachmentsMetadata={attachmentsMetadataSource}/>
        </View>
    )
})
