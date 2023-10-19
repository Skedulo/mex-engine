import React from 'react';
import {requireNativeComponent, ViewProps} from 'react-native';

const RCTSignatureView = requireNativeComponent<Props>('RCTSignatureView');

type Props = ViewProps & {
    onSignatureSaved: (data:OnSignatureSavedResult) => void,
    onSignatureChanged: (data:OnSignatureChangedResult) => void,
}

type OnSignatureSavedResult = {
    imageUrl: string
}

type OnSignatureChangedResult = {
    hasDrawing: boolean
}

const CaptureSignatureView = React.forwardRef((props: Props, ref) => {
    return  <RCTSignatureView {...props} ref={ref as any}/>
})

export default CaptureSignatureView
