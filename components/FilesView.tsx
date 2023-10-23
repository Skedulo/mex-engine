import {useEffect, useLayoutEffect, useRef, useState} from "react";
import AttachmentsManager from "../mex/common/attachments/AttachmentsManager";
import utils from "../mex/common/Utils";
import {Alert, AlertButton, Platform, SafeAreaView, Text, TouchableOpacity, View} from "react-native";
import StylesManager from "../mex/StylesManager";
import ThemeManager from "../mex/colors/ThemeManager";
import ImageView from "react-native-image-viewing";
import * as React from "react";
import SkeduloImage from "./SkeduloImage";
import converters from "../mex/common/Converters";
import SkedIcon, {IconTypes} from "./SkedIcon";
import AssetsManager from "../mex/assets/AssetsManager";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import stylesManager from "../mex/StylesManager";
import { translate } from "../mex/assets/LocalizationManager";
import {AttachmentMetadata} from "../Tools/MexModuleCodeGenerator/mex-engine-core/src/di/ServicesProxy";

const FilesView = ({attachmentsMetadata, isSignature, readonly}: {
    attachmentsMetadata: AttachmentMetadata[],
    isSignature?: boolean,
    readonly: boolean
}) => {

    let [detailsViewVisible, setDetailsViewDetailsViewVisible] = useState(false)

    let selectedImages = useRef<any[]>([]);
    let selectedImageMetadata = useRef<any>(null);

    let removeAttachment = (item: any) => {

        let buttons: AlertButton[] = [
            { text: converters.localization.translate('builtin_attachment_delete_confirm_no_btn'), style: 'cancel', onPress: () => {} },
            {
                text: converters.localization.translate('builtin_attachment_delete_confirm_yes_btn'),
                style: 'destructive',
                // If the user confirmed, then we dispatch the action we blocked earlier
                // This will continue the action that had triggered the removal of the screen
                onPress: () => {
                    setDetailsViewDetailsViewVisible(false)
                    AttachmentsManager.deleteAttachment(item.uid)
                },
            }];

        let title, message;

        title = converters.localization.translate('builtin_attachment_delete_confirm_title')
        message = converters.localization.translate('builtin_attachment_delete_confirm_description')

        // Prompt the user before leaving the screen
        Alert.alert(
            title,
            message,
            buttons
        );

    }

    let selectImage = function(item: AttachmentMetadata) {
        AssetsManager.getAccessToken().then((token:string) => {
            selectedImages.current = [
                {
                    uri: item.localFileURL ?? item.downloadURL,
                    headers: {
                        Authorization: 'Bearer ' + token
                    },
                    cache: "force-cache"
                }
            ]

            selectedImageMetadata.current = item

            setDetailsViewDetailsViewVisible(true)
        })
    }

    let colors = ThemeManager.getColorSet()

    return (
        <View style={{marginTop: stylesManager.stylesConstant.componentVerticalPadding}}>
            <View
                style={{
                    flexDirection: 'column',
                }}>
                {attachmentsMetadata !== null && attachmentsMetadata.length !== 0
                    ? attachmentsMetadata.map((item, _) => {
                        return (
                            <TouchableOpacity
                                key={item.uid}
                                onPress={() => selectImage(item)}>
                                <AttachmentRow item={item} isSignature={isSignature}/>
                            </TouchableOpacity>)
                    })
                    : <Text style={StylesManager.getStyles().textRegular}>{translate("builtin_no_attachments")}</Text>}
            </View>
            <ImageView
                onRequestClose={() => setDetailsViewDetailsViewVisible(false)}
                FooterComponent={() => {
                    let image = selectedImageMetadata.current

                    return (<AttachmentDetailFooter item={image} isSignature={isSignature}/>)
                }}
                HeaderComponent={() => {
                    let image = selectedImageMetadata.current

                    return (<AttachmentDetailHeader
                        isSignature={isSignature}
                        readonly={readonly}
                        image={image}
                        onRequestClosed={() => setDetailsViewDetailsViewVisible(false)}
                        onRequestRemove={(item: any) => removeAttachment(item)}/>)
                }}
                backgroundColor={isSignature ? colors.skeduloBackgroundGrey : undefined}
                doubleTapToZoomEnabled={true}
                visible={detailsViewVisible}
                imageIndex={0}
                images={selectedImages.current}/>
        </View>)
}

let AttachmentDetailHeader = function({image, onRequestClosed, onRequestRemove, isSignature, readonly}: any) {
    let colors = ThemeManager.getColorSet()
    let styleConst = StylesManager.getStyleConst()

    return (<SafeAreaView style={{
        backgroundColor: isSignature ? colors.skedBlue800 : undefined
    }}>
        <View style={{marginLeft: styleConst.defaultVerticalPadding, marginRight: styleConst.defaultVerticalPadding, marginTop: 10, marginBottom: 10, flexDirection: "row"}}>
            <TouchableOpacity
                style={{alignSelf: "center", alignContent: "center"}}
                onPress={onRequestClosed}>
                <SkedIcon
                    style={Platform.OS == 'ios' ? {height: 20, width: 30} : {height: 18, width: 20}}
                    iconType={IconTypes.BackArrow}/>
            </TouchableOpacity>

            <View style={{flex: 1, backgroundColor: "transparent"}} />

            {!readonly ? (<TouchableOpacity
                style={{alignSelf: "flex-end"}}
                onPress={() => onRequestRemove(image)}>
                <Text style={[StylesManager.getStyles().textMedium, {color: ThemeManager.getColorSet().white}]}>Remove</Text>
            </TouchableOpacity>) : null}

        </View>
    </SafeAreaView>)
}

let AttachmentDetailFooter = function({item, isSignature}: any) {

    let colors = ThemeManager.getColorSet()

    let [metadata, setMetadata] = useState(null);

    useLayoutEffect(() => {
        getImageMetadataAsync(item).then((metadata:any) => {
            setMetadata(metadata)
        })
    })

    let title = ""

    if (isSignature) {
        title = item.description ?? item.fileName
    } else {
        title = item.fileName
    }

    const insets = useSafeAreaInsets();

    return (<SafeAreaView style={{
        backgroundColor: isSignature ? colors.skedBlue800 : undefined
    }}>
        <View style={{
            marginLeft: 10,
            marginTop: 10,
            marginBottom: (insets.bottom > 0 ? 0 : 10),
            justifyContent: 'center',
            flexShrink: 1}}>
            <Text
                ellipsizeMode='middle'
                numberOfLines={1}
                style={[StylesManager.getStyles().textHeadingBold, {
                    marginBottom: 5, color: ThemeManager.getColorSet().white, fontSize: 18
                }]}>{title}</Text>
            <Text
                ellipsizeMode='tail'
                numberOfLines={1}
                style={[StylesManager.getStyles().textRegular, {color: ThemeManager.getColorSet().white, fontSize: 14}]}>{metadata}</Text>
        </View>
    </SafeAreaView>)
}

const AttachmentRow = function({item, isSignature}: {item: AttachmentMetadata, isSignature?: boolean}) {
    const _isMounted = useRef(true);

    useEffect(() => {
        return () => {
            _isMounted.current = false;
        }
    }, []);

    let [metadata, setMetadata] = useState(null);

    useEffect(() => {
        getImageMetadataAsync(item).then((metadata:any) => {
            if (_isMounted.current) {
                setMetadata(metadata)
            }
        })
    })

    let finalUrl = item.localFileURL ?? item.downloadURL;

    let title = ""

    if (isSignature) {
        title = item.description ?? item.fileName
    } else {
        title = item.fileName
    }

    return (<View
        style={{
            flexDirection: "row",
            paddingTop: 5,
            opacity: item.status === "uploading" ? 0.5 : 1
        }}>
        <View style={{
            height: 50,
            width: 50
        }}>
            <SkeduloImage
                style={{
                    height: "100%",
                    width: "100%",
                }}
                uri={finalUrl}/>
        </View>

        <View style={{marginLeft: 10, justifyContent: 'center', flexShrink: 1}}>
            <Text
                ellipsizeMode='middle'
                numberOfLines={1}
                style={[StylesManager.getStyles().textRegular, {marginBottom: 5, fontSize: 14}]}>
                {title}
            </Text>
            <Text
                ellipsizeMode='tail'
                numberOfLines={1}
                style={[StylesManager.getStyles().textCaptionListItem, {fontSize: 14}]}>{metadata}</Text>
        </View>
    </View>)
}

let getImageMetadataAsync = (item: any) => {
    if (!item.uploadDate || !item.size) {
        return Promise.resolve("")
    }

    let readableUploadDate = "";
    let readableSize = utils.fileSize.humanFileSize(item.size, true);

    return converters.date.dateTimeFormat(item.uploadDate)
        .then((result:any) => {
            readableUploadDate = result

            return `${readableUploadDate} • ${readableSize}`;
        })
}

export default FilesView