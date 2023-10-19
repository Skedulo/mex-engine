import {NativeModules} from "react-native";

const { MexSimpleStorageModule } = NativeModules;

interface MexSimpleStorageModuleMapper {
    setByKey(key: string, data: string) : void;
    removeByKey(key: string) : void;
    getByKey(key: string) : Promise<any>
}

export default MexSimpleStorageModule as MexSimpleStorageModuleMapper