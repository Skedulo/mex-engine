import {NativeModules} from "react-native";
import AssetsManager from "../assets/AssetsManager";

class LogManager {

    logError(e: Error, stack: string): Promise<void> {
        return NativeModules.MexMainModule.logError(`[MEX] - ${e.message}`, stack)
    }

    trackEvent(eventName: String, properties: any): Promise<void> {
        return NativeModules.MexMainModule.trackEvent(`MEX - ${AssetsManager.cachedFormName} - ${eventName}`, JSON.stringify(properties))
    }
}

export default new LogManager() as LogManager
