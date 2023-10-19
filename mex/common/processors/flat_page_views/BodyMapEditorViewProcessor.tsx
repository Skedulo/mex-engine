import * as React from "react";
import {Image, Text, StyleSheet, View, StyleProp, ViewStyle, TouchableOpacity} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions, {ExpressionArgs} from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {runInAction} from "mobx";
import {MutableRefObject, useCallback, useContext, useEffect, useReducer, useRef} from "react";
import Expression from "../../expression/Expressions";
import AttachmentsManager from "../../attachments/AttachmentsManager";
import ThemeManager from "../../../colors/ThemeManager";
import {AttachmentMetadata} from "../../../../components/FilesView";
import SkeduloImage from "../../../../components/SkeduloImage";
import NavigationProcessManager from "../../NavigationProcessManager";
import RNFS from "react-native-fs";
import utils from "../../Utils";
import lodash from "lodash";
import {BodyMapViewComponentModel} from "@skedulo/mex-types";
import {PageProcessorContext, PageProcessorContextObj} from "../../../hooks/useCrudOnPage";

type BodyMapEditorViewProps = EditorViewProps<BodyMapEditorViewArgs, BodyMapViewComponentModel>

type BodyMapEditorViewArgs = EditorViewArgs<BodyMapViewComponentModel> & {
}

type BodyMapType = "front"|"back"

export default class BodyMapEditorViewProcessor
    extends AbstractEditorViewProcessor<BodyMapEditorViewProps, BodyMapEditorViewArgs, BodyMapViewComponentModel> {

    getTypeName(): string {
        return "bodyMapEditor"
    }

    override useValidator(_: BodyMapEditorViewArgs): boolean {
        return false
    }

    override useTitle(): boolean {
        return false
    }

    getBodyMapPrefix(type: BodyMapType):string {
        return `bodymap-${type}__`;
    }

    generateEditorComponent(args: BodyMapEditorViewArgs): JSX.Element {

        const _isMounted = useRef(true);

        const viewInput = useRef<null>() as MutableRefObject<any>;

        let pageContext = useContext<PageProcessorContextObj|undefined>(PageProcessorContext)
        const attachmentRef = useRef()

        let styles = StylesManager.getStyles()
        let styleConst = StylesManager.getStyleConst()

        useEffect(() => {
            pageContext?.focusableControls.push({
                canFocus: false,
                key: viewInput.current,
            })
            return () => {
                _isMounted.current = false;
                let index = pageContext?.focusableControls.findIndex(item => item.key === viewInput.current);

                if (index !== -1) {
                    pageContext?.focusableControls.slice(index, 1)
                }
            }
        }, []);

        let metadataIsLoading = useRef(true)
        const [, forceUpdate] = useReducer(x => x + 1, 0);

        let attachmentsMetadata = useRef<AttachmentMetadata[]>([])

        let {jsonDef, dataContext} = args;

        let hasAttachmentsDataArgs:ExpressionArgs = {dataContext: dataContext, expressionStr: jsonDef.sourceExpression + ".__hasAttachments"}
        let parentContextValueArgs:ExpressionArgs = {dataContext: dataContext, expressionStr: jsonDef.sourceExpression}

        let parentContext = Expression.getRawDataValueExpression(parentContextValueArgs);
        let attachmentCategoryName = jsonDef.attachmentCategoryName
        let parentId = parentContext.UID

        // subscribe for changes
        useEffect(() => {

            let getAttachmentsDebounce = lodash.throttle(function(attachments: AttachmentMetadata[]) {
                attachmentsMetadata.current = attachments;

                let hasAttachment = Expressions.getRawDataValueExpression(hasAttachmentsDataArgs)
                let hasAttachmentNewValue = attachments != null && attachments.length > 0

                if (hasAttachment != hasAttachmentNewValue) {
                    runInAction(() => {
                        Expression.setDataValueExpression(hasAttachmentsDataArgs , hasAttachmentNewValue)
                    })
                }

                if (metadataIsLoading.current) {
                    metadataIsLoading.current = false;
                }

                forceUpdate();
            }, 500, {'leading': false})

            AttachmentsManager.observeAttachmentsChangeForContext(attachmentRef, parentId, "ATTACHMENT", attachmentCategoryName, getAttachmentsDebounce);

            return () => {
                AttachmentsManager.unsubscribeAttachmentsChangeForContext(attachmentRef, parentId, "ATTACHMENT", attachmentCategoryName)
            }
        }, [])

        let frontImageSrc = attachmentsMetadata.current.filter(img => img.fileName.startsWith(attachmentCategoryName + "__" + this.getBodyMapPrefix("front")))
        let backImageSrc = attachmentsMetadata.current.filter(img => img.fileName.startsWith(attachmentCategoryName + "__" + this.getBodyMapPrefix("back")))

        let frontImage: AttachmentMetadata|null = null
        let backImage: AttachmentMetadata|null = null

        if (frontImageSrc.length > 0) frontImage = frontImageSrc[frontImageSrc.length - 1]
        if (backImageSrc.length > 0) backImage = backImageSrc[backImageSrc.length - 1]

        const uploadImage = async (uri:string|undefined, type: BodyMapType) => {
            if (!uri) return;

            let parts = uri.split('/')
            let fileName = `bodymap-${type}__`  + parts.pop()

            parts.push(fileName)

            let destPath = "file://" + parts.join('/')

            // Change uri file name into something else
            await RNFS.moveFile(uri, destPath)
            let uid = utils.data.generateUniqSerial('local')

            await AttachmentsManager.addAttachments([{
                uid: uid,
                uri: destPath
            }], parentContext.UID, attachmentCategoryName)
        }

        const createNew = useCallback(async (type: BodyMapType) => {
            let uri = await NavigationProcessManager.navigate("bodyMapScreen", {imageSource: type == "front"
                    ? require("../../../../img/bodymap_front.png")
                    : require("../../../../img/bodymap_back.png")})

            await uploadImage(uri, type)

        }, [attachmentsMetadata.current])

        const edit = useCallback(async (a: AttachmentMetadata, type: BodyMapType) => {
            let uri = await NavigationProcessManager.navigate("bodyMapScreen", {imageSource: (a.downloadURL ?? a.localFileURL)})

            if (!uri) return; /* Stop when there is no edit */

            await uploadImage(uri, type)
            await AttachmentsManager.deleteAttachment(a.uid)
        }, [attachmentsMetadata.current])

        const remove = useCallback((a: AttachmentMetadata, _: BodyMapType) => {
            AttachmentsManager.deleteAttachment(a.uid)
        }, [attachmentsMetadata.current])

        return (
            <View ref={viewInput}>

                <Text style={[styles.textMedium, { marginBottom: styleConst.smallVerticalPadding }]}>Body Map</Text>

                <View style={{flexDirection: "row", alignItems: 'center'}}>
                    <BodyMapItemComponent
                        createNewCallback={createNew}
                        editCallback={edit}
                        removeCallback={remove}
                        style={{marginRight: styleConst.betweenTextSpacing}} image={frontImage} type="front"/>

                    <BodyMapItemComponent
                        createNewCallback={createNew}
                        editCallback={edit}
                        removeCallback={remove}
                        image={backImage} type="back"/>
                </View>
            </View>
        )
    }
}

export const BodyMapItemComponent = (
    {
        image, type, style,
        createNewCallback, removeCallback, editCallback
    }: {
        image: AttachmentMetadata|null,
        type: BodyMapType,
        style?: StyleProp<ViewStyle> | undefined,
        createNewCallback: (type: BodyMapType) => void,
        removeCallback: (a: AttachmentMetadata, type: BodyMapType) => void,
        editCallback: (a: AttachmentMetadata, type: BodyMapType) => void
    }) => {



    return (<View
        style={[localStyles.imageContainer, style]}>

        {image
            ?
            <View>
                <TouchableOpacity onPress={() => editCallback(image!, type)}>
                    <SkeduloImage
                        resizeMode="contain"
                        style={localStyles.image}
                        uri={image.downloadURL ?? image.localFileURL}/>
                </TouchableOpacity>

                <View
                    pointerEvents={"box-none"}
                    style={{
                        position: 'absolute',
                        justifyContent: "flex-end",
                        width: '100%',
                        height: '100%',
                    }}>
                    <TouchableOpacity
                        onPress={() => removeCallback(image!, type)}>
                        <View style={[localStyles.editBodyMapContainer, { backgroundColor: ThemeManager.getColorSet().red800 }]}>
                            <Text style={[StylesManager.getStyles().textMedium,localStyles.addBodyMapText]}>Remove</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            :
            <View>
                <Image
                    style={localStyles.image}
                    source={type == "front"
                        ? require("../../../../img/bodymap_front.png")
                        : require("../../../../img/bodymap_back.png") }/>

                <View
                    style={{
                        position: 'absolute',
                        alignItems: "center",
                        justifyContent: "center",
                        width: '100%',
                        height: '100%',
                    }}>
                    <View style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundColor: ThemeManager.getColorSet().overlayColor,
                        opacity: 0.6,
                    }}/>
                    <TouchableOpacity onPress={() => createNewCallback(type)}>
                        <View style={localStyles.addBodyMapContainer}>
                            <Text style={[StylesManager.getStyles().textMedium,localStyles.addBodyMapText]}>Add</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        }

        <View
            style={{height: 30, position: "absolute", width: "100%", justifyContent: "center", alignItems: "center"}}>
            <View style={{
                backgroundColor: ThemeManager.getColorSet().overlayColor, opacity: 0.8, height: "100%", width: "100%", position: "absolute"}}/>

            <Text style={[StylesManager.getStyles().textMedium,
                {
                    textAlign: "center",
                    width: "100%",
                    color: "white"
                }]}>
                {type == "front" ? "Front" : "Back" }
            </Text>
        </View>
    </View>)
}

const localStyles = StyleSheet.create({
    addBodyMapContainer: {
        borderRadius: 5,
        borderColor: "white",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        backgroundColor: "black",
        height: 50,
        width: 100,
    },
    editBodyMapContainer: {
        borderRadius: 5,
        borderColor: "white",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        borderWidth: 1,
        height: 40,
        width: 75,
    },
    addBodyMapText: {
        color: "white",
    },
    container: {
        flex: 1,
        flexDirection: "row",
    },
    imageContainer: {
        flex: 1,
        width: "100%",
        aspectRatio: 9/16,
        flexDirection: "column"
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
    },
});
