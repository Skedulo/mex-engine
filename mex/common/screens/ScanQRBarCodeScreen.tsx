import React from 'react'
import {SafeAreaView, TouchableOpacity, View} from "react-native";
import BarcodeMask from "react-native-barcode-mask";
import SkedIcon from "../../../components/SkedIcon";
import ScanQRBarcodeView from "../../../components/ScanQrBarcodeView";
import NavigationProcessManager from "../NavigationProcessManager";
import {IconTypes} from "@skedulo/mex-engine-proxy";

type Props = {

}

const ScanQRBarCodeScreen: React.FC<Props> = () => {

    let onBarcodeOrQRCodeDetected = function (data: any) : void {
        NavigationProcessManager.goBack(data.nativeEvent.rawValue)
    }

    let onCameraPermissionNotGranted = function () : void {
        NavigationProcessManager.goBack()
    }

    let cancel = function () : void {
        NavigationProcessManager.goBack()
    }

    return (
        <View
            style={{flex: 1}}>
            <ScanQRBarcodeView
                style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                }}
                onBarcodeOrQRCodeDetected={onBarcodeOrQRCodeDetected}
                onCameraPermissionNotGranted={onCameraPermissionNotGranted}>
            </ScanQRBarcodeView>

            <BarcodeMask
                showAnimatedLine={false}/>

            <SafeAreaView
                style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%"
                }}>
                <TouchableOpacity
                    style={{left: 20, top: 20}}
                    onPress={cancel}>
                    <SkedIcon
                        style={{height: 30, width: 30}}
                        iconType={IconTypes.BackArrow}/>
                </TouchableOpacity>
            </SafeAreaView>

        </View>)
}

export default ScanQRBarCodeScreen
