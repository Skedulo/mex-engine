import React, {useEffect, useState} from 'react';
import {PermissionsAndroid, Platform, requireNativeComponent, ViewProps} from 'react-native';

const RCTScanQRBarcodeView = requireNativeComponent('RCTScanQRBarcodeView');

type Props = ViewProps & {
    onBarcodeOrQRCodeDetected: (data:any) => void
    onCameraPermissionNotGranted: () => void
}

const ScanQRBarcodeView = (props:Props) => {

    let isAndroid = Platform.OS !== "ios";

    let hasCameraPermission: Promise<boolean>;

    if (isAndroid) {
        hasCameraPermission = PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
    } else {
        hasCameraPermission = Promise.resolve(true)
    }

    let [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        const requestCameraPermission = async () => {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Need access to camera",
                        message:
                            "We need access to your camera in order to scan qr/barcode",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setShowCamera(true)
                } else {
                }
            } catch (err) {
            }
        };

        hasCameraPermission.then(result => {
            if (result) {
                setShowCamera(true)
            } else {
                requestCameraPermission()
            }
        });
    });

    return (showCamera ? <RCTScanQRBarcodeView {...props} /> : null)
}

export default ScanQRBarcodeView