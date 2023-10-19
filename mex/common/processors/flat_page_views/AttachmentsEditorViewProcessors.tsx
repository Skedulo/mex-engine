import * as React from "react";
import {Text, TouchableOpacity, View} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions, {ExpressionArgs} from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {makeAutoObservable, runInAction} from "mobx";
import {MutableRefObject, useContext, useEffect, useMemo, useReducer, useRef} from "react";
import Expression from "../../expression/Expressions";
import AttachmentsManager from "../../attachments/AttachmentsManager";
import utils from "../../Utils";
import {ImagePickerResponse, launchCamera, launchImageLibrary} from "react-native-image-picker";
import ThemeManager from "../../../colors/ThemeManager";
import converters from "../../Converters";
import MexAsyncText from "../../../../components/MexAsyncText";
import BottomSheet from "../../plugins/BottomSheet";
import FilesView, {AttachmentMetadata} from "../../../../components/FilesView";
import lodash from "lodash";
import ErrorTextWithRef from "../../../../components/ErrorText";
import {AttachmentsEditorViewComponentModel} from "@skedulo/mex-types";
import {PageProcessorContext, PageProcessorContextObj} from "../../../hooks/useCrudOnPage";
let {translate} = converters.localization

type AttachmentsEditorViewProps = EditorViewProps<AttachmentsEditorViewArgs, AttachmentsEditorViewComponentModel>

type AttachmentsEditorViewArgs = EditorViewArgs<AttachmentsEditorViewComponentModel> & {
}

export default class AttachmentsEditorViewProcessor
    extends AbstractEditorViewProcessor<AttachmentsEditorViewProps, AttachmentsEditorViewArgs, AttachmentsEditorViewComponentModel> {

    getTypeName(): string {
        return "attachmentsEditor"
    }

    override useValidator(_: AttachmentsEditorViewArgs): boolean {
        return false
    }

    override useTitle(): boolean {
        return false
    }

    generateEditorComponent(args: AttachmentsEditorViewArgs): JSX.Element {

        const _isMounted = useRef(true);

        const viewInput = useRef<null>() as MutableRefObject<any>;
        const attachmentRef = useRef()

        let pageContext = useContext<PageProcessorContextObj|undefined>(PageProcessorContext)

        const readonly = this.isComponentReadonly(args.jsonDef.readonly, args.dataContext)

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

        let transformedDataContext = useMemo(() => {
            return makeAutoObservable({
                ...dataContext,
                attachments: attachmentsMetadata.current
            })
        }, [dataContext])

        let transformedDataContextRef = useRef(transformedDataContext)

        dataContext = transformedDataContextRef.current

        let hasAttachmentsDataArgs:ExpressionArgs = {dataContext: dataContext, expressionStr: jsonDef.sourceExpression + ".__hasAttachments"}
        let parentContextValueArgs:ExpressionArgs = {dataContext: dataContext, expressionStr: jsonDef.sourceExpression}

        let parentContext = Expression.getRawDataValueExpression(parentContextValueArgs);
        let attachmentCategoryName = jsonDef.attachmentCategoryName
        let parentId = parentContext.UID

        // subscribe for changes
        useEffect(() => {

            let getAttachmentsDebounce = lodash.throttle(function(attachments: AttachmentMetadata[]) {
                attachmentsMetadata.current = attachments;

                runInAction(() => {
                    transformedDataContextRef.current.attachments = attachments;
                })

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

            AttachmentsManager.addAttachments(addAttachmentRequests, parentContext.UID, attachmentCategoryName)
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

        const getTitle = async (): Promise<string> => {
            let title = Expressions.getValueFromLocalizedKey({expressionStr: args.jsonDef.title, dataContext: args.dataContext})

            if (title instanceof Promise) {
                return await title
            }

            return title;
        }

        let validatedRef = useRef<boolean>(true)

        return (
            <View ref={viewInput}>
                <View style={{flexDirection: "row", alignItems: 'center'}}>
                    <MexAsyncText promiseFn={getTitle}>
                        {(text) => (
                            <Text style={[StylesManager.getStyles().textHeadingBold, {flex: 1}]}>{text}</Text>)}
                    </MexAsyncText>

                    {!readonly ? (<TouchableOpacity
                        onPress={showPickFileBottomSheet}
                        style={{alignSelf: 'center'}}>
                        <Text style={{
                            color: ThemeManager.getColorSet().skeduloBlue,
                            fontSize: 18
                        }}>Add</Text>
                    </TouchableOpacity>) : null}
                </View>

                {jsonDef.validator ? <ErrorTextWithRef
                    ref={validatedRef}
                    dataContext={transformedDataContextRef.current}
                    jsonDef={jsonDef.validator}/> : null}

                <FilesView readonly={readonly} attachmentsMetadata={attachmentsMetadataSource}/>
            </View>
        )
    }
}
