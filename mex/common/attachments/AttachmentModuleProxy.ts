import {NativeModules} from "react-native";

const { AttachmentModule } = NativeModules;

type LocalFileMetadata = {
    url: String,
    fileName: String,
    fileSizeInMb: number
}

class AttachmentModuleProxy {
    async pickFiles(): Promise<LocalFileMetadata[]> {
        const jsonStr = await AttachmentModule.pickFiles()

        let jsonObject = JSON.parse(jsonStr)

        if (!jsonObject)
            return []

        return jsonObject as LocalFileMetadata[]
    }

    async pickMedias(): Promise<LocalFileMetadata[]> {
        const jsonStr = await AttachmentModule.pickMedias()

        let jsonObject = JSON.parse(jsonStr)

        if (!jsonObject)
            return []

        return jsonObject as LocalFileMetadata[]
    }

    async generateThumbnailForFile(attachmentUid: string, filePath: string): Promise<String> {
        return await AttachmentModule.generateThumbnailForFile(attachmentUid, filePath)
    }

    async openFile(attachmentUid: string) {
        return await AttachmentModule.openFile(attachmentUid)
    }
}

export default new AttachmentModuleProxy() as AttachmentModuleProxy
