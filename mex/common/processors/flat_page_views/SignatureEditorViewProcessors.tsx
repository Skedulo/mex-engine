import * as React from "react";
import {ActivityIndicator, Text, TouchableOpacity, View} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions, {ExpressionArgs} from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {makeAutoObservable, runInAction} from "mobx";
import {MutableRefObject, useEffect, useMemo, useReducer, useRef} from "react";
import Expression from "../../expression/Expressions";
import AttachmentsManager from "../../attachments/AttachmentsManager";
import utils from "../../Utils";
import ThemeManager from "../../../colors/ThemeManager";
import MexAsyncText from "../../../../components/MexAsyncText";
import FilesView, {AttachmentMetadata} from "../../../../components/FilesView";
import * as RootNavigation from "../../RootNavigation";
import NavigationProcessManager from "../../NavigationProcessManager";
import lodash from "lodash";
import ErrorTextWithRef from "../../../../components/ErrorText";
import {SignatureEditorViewComponentModel} from "@skedulo/mex-types";
type SignatureEditorViewProps = EditorViewProps<SignatureEditorViewArgs, SignatureEditorViewComponentModel>

type SignatureEditorViewArgs = EditorViewArgs<SignatureEditorViewComponentModel> & {
}

export default class SignatureEditorViewProcessor
    extends AbstractEditorViewProcessor<SignatureEditorViewProps, SignatureEditorViewArgs, SignatureEditorViewComponentModel> {

    getTypeName(): string {
        return "signatureEditor"
    }

    override useValidator(_: SignatureEditorViewArgs): boolean {
        return false
    }

    override useTitle(): boolean {
        return false
    }

    generateEditorComponent(args: SignatureEditorViewArgs): JSX.Element {

        const _isMounted = useRef(true);
        const readonly = this.isComponentReadonly(args.jsonDef.readonly, args.dataContext)

        const viewInput = useRef<null>() as MutableRefObject<any>;
        const attachmentRef = useRef()

        useEffect(() => {
            return () => {
                _isMounted.current = false;
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

                if (hasAttachmentNewValue && hasAttachment != hasAttachmentNewValue) {
                    runInAction(() => {
                        Expression.setDataValueExpression(hasAttachmentsDataArgs , hasAttachmentNewValue)
                    })
                }

                if (metadataIsLoading.current) {
                    metadataIsLoading.current = false;
                }

                forceUpdate();
            }, 500, {'leading': false})


            AttachmentsManager.observeAttachmentsChangeForContext(attachmentRef, parentId, "SIGNATURE", attachmentCategoryName, getAttachmentsDebounce);

            return () => {
                AttachmentsManager.unsubscribeAttachmentsChangeForContext(attachmentRef, parentId, "SIGNATURE", attachmentCategoryName)
            }
        }, [])


        let openSignatureScreen = function() {
            let routeName = "captureSignatureScreen";

            RootNavigation.navigate(routeName, {enableFullName: jsonDef.enableFullName})

            NavigationProcessManager.addTrack(routeName)
                .then(result => {
                    runInAction(() => {

                        if (!result || !result.imageUrl)
                            return

                        AttachmentsManager.addSignature({
                            uid: utils.data.generateUniqSerial('local'),
                            uri: result.imageUrl,
                            fullName: result.fullName
                        }, parentContext.UID, attachmentCategoryName)
                    })
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
            <View>
                <View style={{flexDirection: "row", alignItems: 'center'}}>
                <MexAsyncText promiseFn={getTitle}>
                        {(text) => (
                            <Text style={[StylesManager.getStyles().textHeadingBold, {flex: 1}]}>{text}</Text>)}
                    </MexAsyncText>

                    {!readonly ? (<TouchableOpacity
                        onPress={openSignatureScreen}
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

                {metadataIsLoading.current ? (<ActivityIndicator color={ThemeManager.getColorSet().skedBlue900} size="large" />)
                    : (<FilesView
                            isSignature={true}
                            readonly={readonly}
                            attachmentsMetadata={attachmentsMetadataSource}/>)}
            </View>
        )
    }
}
