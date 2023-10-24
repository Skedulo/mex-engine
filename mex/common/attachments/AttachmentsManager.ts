import {NativeEventEmitter, NativeModules} from "react-native";
import {AttachmentMetadata, AttachmentSetting, IAttachmentsManager} from "@skedulo/mex-engine-proxy";
const { AttachmentModule } = NativeModules;

type SubscriberCachingData = {
    key: string,
    action: (attachments: AttachmentMetadata[]) => void
}

class AttachmentsManager implements IAttachmentsManager {

    private attachmentSubscriptionHashMap: Map<any, SubscriberCachingData> = new Map()
    private attachmentCachingHashMap: {[key: string]: any} = {}

    initialize() {
        const eventEmitter = new NativeEventEmitter(NativeModules.ReactNativeEventEmitter)

        // Register instance data changed
        eventEmitter.addListener("attachmentsFromParentContextChanged", (data) => {
            data = JSON.parse(data)

            // Notify changes
            for (const [_, subscriberCachingData] of this.attachmentSubscriptionHashMap) {

                let key = subscriberCachingData.key

                if (!key.startsWith(data.parentId)) {
                    // Subscription not related, bail
                    continue
                }

                let [_, attachmentType, categoryName] = this.getParentContextAndCategoryNameFromKey(key)

                let filteredAttachments: AttachmentMetadata[];
                filteredAttachments = data.attachments.filter((a: { fileName: string, category: string }) => {

                    let fileName = a.fileName

                    if (attachmentType != a.category) {
                        // Check if the subscription is attachment or signature
                        return false
                    }

                    if (!categoryName) {
                        // If the control doesn't register category, don't check anymore
                        return true
                    }

                    if (attachmentType === "SIGNATURE" && fileName.startsWith("signature_")) {
                        // If it's a Signature, most likely the filename will start with "signature_", therefore we have to get rid of it
                        fileName = fileName.replace("signature_", "")
                    }

                    // Get attachments with fileName with prefix of the MEX category name
                    return fileName.startsWith(categoryName + "__");
                })

                // Cache the last result for this key
                this.attachmentCachingHashMap[key] = filteredAttachments

                subscriberCachingData.action(filteredAttachments)
            }
        })
    }

    getAttachmentsMetadata(attachmentsGuids: string, attachmentCategoryName: string): AttachmentMetadata[] {
        return AttachmentModule.getAttachments(attachmentsGuids, attachmentCategoryName)
            .then((attachmentsResultStr: string) => JSON.parse(attachmentsResultStr));
    }

    async getAttachmentSettings(): Promise<AttachmentSetting> {
        let jsonStr = await AttachmentModule.getAttachmentSettings() as string

        return JSON.parse(jsonStr)
    }

    getAttachmentDisplayUrl = function(downloadUrl: string) {
        return AttachmentModule.getAttachmentDisplayUrl(downloadUrl)
    }

    addAttachments = function(addAttachmentRequest: any, parentContextId: string, attachmentCategoryName: string) : Promise<any> {
        return AttachmentModule.addAttachments(JSON.stringify(addAttachmentRequest), parentContextId, attachmentCategoryName)
    }

    addSignature = function(addSignatureRequest: any, parentContextId: string, attachmentCategoryName: string) : Promise<any> {
        return AttachmentModule.addSignature(JSON.stringify(addSignatureRequest), parentContextId, attachmentCategoryName)
    }

    deleteAttachment = function(deleteAttachmentUId: string) {
        return AttachmentModule.deleteAttachment(deleteAttachmentUId)
    }

    observeAttachmentsChangeForContext = (
        ref: any,
        parentContextId: string,
        attachmentTypeCategoryName: "ATTACHMENT" | "SIGNATURE",
        attachmentCategoryName: string,
        action: (attachments: AttachmentMetadata[]) => void) => {

        let subscriberKey = this.getSubscribeKey(parentContextId, attachmentTypeCategoryName, attachmentCategoryName)

        let isSubscribed = this.alreadySubscribedWithParentKey(parentContextId)

        this.attachmentSubscriptionHashMap.set(ref, {
            key: subscriberKey,
            action: action
        })

        if (!isSubscribed) {
            // No subscription, make a subscription now
            AttachmentModule.observeAttachmentsChangeForContext(parentContextId)
        } else {
            // Already subscribed before and this is a new subscribed, trigger the callback immediately with current result
            this.attachmentSubscriptionHashMap.get(ref)!.action(this.attachmentCachingHashMap[subscriberKey] ?? [])
        }
    }

    unsubscribeAttachmentsChangeForContext = (ref: any, parentContextId: string, attachmentTypeName: "ATTACHMENT"|"SIGNATURE", attachmentCategoryName: string) => {

        let subscriberKey = this.getSubscribeKey(parentContextId, attachmentTypeName, attachmentCategoryName)

        this.attachmentSubscriptionHashMap.delete(ref)

        // Look for there is any ref that's pointing to the cache
        let hasRef = false

        for (const [_, subscriberCachingData] of this.attachmentSubscriptionHashMap) {
            if (subscriberCachingData.key == subscriberKey) {
                hasRef = true
                break
            }
        }

        if (!hasRef) {
            // There is no ref, remove the cache
            delete this.attachmentCachingHashMap[subscriberKey]
        }

        if (!this.alreadySubscribedWithParentKey(parentContextId)) {
            // No subscription, unsubscribe from native
            AttachmentModule.unsubscribeAttachmentsChangeForContext(parentContextId)
        }
    }

    alreadySubscribedWithParentKey(parentContextId: string) {
        for (const [_, subscriberCachingData] of this.attachmentSubscriptionHashMap) {
            if (subscriberCachingData.key.startsWith(parentContextId)) {
                return true
            }
        }

        return false
    }

    getSubscribeKey(parentContextId: string, attachmentTypeCategoryName: string, attachmentCategoryName?: string) {
        let key = "" + parentContextId + "__" + attachmentTypeCategoryName;

        if (!attachmentCategoryName) {
            return key;
        } else {
            return key + "__"  + attachmentCategoryName;
        }
    }

    getParentContextAndCategoryNameFromKey(key: string): [parentId: string, attachmentTypeCategoryName: string, attachmentCategoryName: string] {
        let [parentId, attachmentTypeCategoryName, attachmentCategoryName] = key.split("__")

        return [parentId, attachmentTypeCategoryName, attachmentCategoryName]
    }
}

export default new AttachmentsManager() as AttachmentsManager
