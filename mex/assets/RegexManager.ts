import AssetsManager from "./AssetsManager"
import GlobalConfigurations, {DevelopmentModeConfigEnum} from "../GlobalConfiguration"
import localRegex from "../../local_data/resources/regex"
import RNFS from 'react-native-fs'

class RegexManager {

    regexListObject = ''

    async initialize(): Promise<boolean> {
        if (GlobalConfigurations.canUseDevelopmentConfig(DevelopmentModeConfigEnum.UseLocalRegexFile)) {
            this.regexListObject = localRegex
            return true
        }
        try {
            const filePath = `${RNFS.DocumentDirectoryPath}/mex/resources/${AssetsManager.cachedStaticResourcesId}/regex.js`
            const exist = await RNFS.exists(filePath)
            if (!exist) {
                return true
            }

            this.regexListObject = await RNFS.readFile(filePath)
            return true
        } catch (error) {
            console.log("Error while loading remote regex file:", error)
            return false
        }
    }

    getRegexListString(): string {
        return this.regexListObject
    }
}

export default new RegexManager() as RegexManager
