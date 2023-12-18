import React from 'react';
import {requireNativeComponent} from 'react-native';
import {CaptureSignatureViewProps} from "@skedulo/mex-engine-proxy";

const RCTSignatureView = requireNativeComponent<CaptureSignatureViewProps>('RCTSignatureView');

const CaptureSignatureView = React.forwardRef((props: CaptureSignatureViewProps, ref) => {
    return  <RCTSignatureView {...props} ref={ref as any}/>
})

export default CaptureSignatureView
