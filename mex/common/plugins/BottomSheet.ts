import {ActionSheetIOS, NativeModules, Platform} from 'react-native';

export interface OptionsType {
    options?: string[];
    title?: string;
    dark?: boolean;
    cancelButtonIndex?: number;
}

class BottomSheetIOS implements BottomSheet {
    showBottomSheetWithOptions(options: OptionsType, callback: (value: number) => (void | undefined) | Promise<void>) {
        // @ts-ignore
        return ActionSheetIOS.showActionSheetWithOptions(options, callback);
    }
}

interface BottomSheet {
    showBottomSheetWithOptions: (options: OptionsType, callback: (value: number) => void | undefined | Promise<void>) => void
}

const BottomSheetInstance:BottomSheet =  Platform.OS === 'ios'
    ? new BottomSheetIOS()
    : NativeModules.MexBottomSheetModule as BottomSheet;

export default BottomSheetInstance as BottomSheet