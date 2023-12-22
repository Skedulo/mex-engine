/* eslint @typescript-eslint/prefer-nullish-coalescing: 0 */
import * as React from 'react';
import {
    View,
    Text,
    Modal,
    ActivityIndicator,
    TextStyle,
    ViewStyle
} from 'react-native';

export interface SpinnerOverlayPropTypes {
    cancelable?: boolean;
    color?: string;
    animation?: 'none' | 'slide' | 'fade';
    overlayColor?: string;
    size?: 'small' | 'large' | number; // size props does not support value normal
    textContent?: string;
    textStyle?: TextStyle;
    visible?: boolean;
    indicatorStyle?: ViewStyle;
    customIndicator?: React.ReactNode;
    children?: React.ReactNode;
    spinnerKey?: string;
}

const SpinnerOverlay = ({
                     cancelable = false,
                     color = 'white',
                     animation = 'none',
                     overlayColor = 'rgba(0, 0, 0, 0.5)',
                     size = 'large',
                     textContent = '',
                     textStyle,
                     visible = false,
                     indicatorStyle,
                     customIndicator,
                     children,
                     spinnerKey
                 }: SpinnerOverlayPropTypes) => {
    const [spinnerVisible, setSpinnerVisibility] = React.useState(visible);
    const close = () => {
        setSpinnerVisibility(false);
    };

    const _handleOnRequestClose = () => {
        if (cancelable) {
            close();
        }
    };

    React.useEffect(() => {
        setSpinnerVisibility(visible);
    }, [visible]);
    const _renderDefaultContent = () => {
        return (
            <View style={styles.background}>
                {customIndicator || (
                    <ActivityIndicator
                        color={color}
                        size={size}
                        style={[styles.activityIndicator, { ...indicatorStyle }]}
                    />
                )}
                <View style={[styles.textContainer, { ...indicatorStyle }]}>
                    <Text style={[styles.textContent, textStyle]}>{textContent}</Text>
                </View>
            </View>
        );
    };

    const _renderSpinner = () => {
        const spinner = (
            <View
                style={[styles.container, { backgroundColor: overlayColor }]}
                key={spinnerKey || `spinner_${Date.now()}`}
            >
                {children || _renderDefaultContent()}
            </View>
        );

        return (
            <Modal
                animationType={animation}
                onRequestClose={() => {
                    _handleOnRequestClose();
                }}
                supportedOrientations={['landscape', 'portrait']}
                transparent
                visible={spinnerVisible}
                statusBarTranslucent={true}
            >
                {spinner}
            </Modal>
        );
    };

    return _renderSpinner();
};

import { StyleSheet } from 'react-native';

const transparent = 'transparent';
const styles = StyleSheet.create({
    activityIndicator: {
        flex: 1
    },
    background: {
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },
    container: {
        backgroundColor: transparent,
        bottom: 0,
        flex: 1,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },
    textContainer: {
        alignItems: 'center',
        bottom: 0,
        flex: 1,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },
    textContent: {
        fontSize: 20,
        fontWeight: 'bold',
        height: 50,
        top: 80
    }
});

export default SpinnerOverlay;
