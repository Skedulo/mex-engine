import {NativeModules} from "react-native";

const { CoreV3UIModule } = NativeModules;

interface CoreV3UIModuleMapper {
    showMessage(text: string, type: "default" | "success" | "error") : void;
}

export default  CoreV3UIModule as CoreV3UIModuleMapper