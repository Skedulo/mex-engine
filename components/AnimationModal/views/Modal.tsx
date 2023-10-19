import React, {useEffect, useRef, useState} from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    BackHandler,
    StyleProp
} from 'react-native';
import DraggableView from '../components/DraggableView';
import Backdrop from '../components/Backdrop';
import FadeAnimation from '../animations/FadeAnimation';
import SlideAnimation from "../animations/SlideAnimation";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

enum MODAL_STATE {
    MODAL_OPENING = 'opening',
    MODAL_OPENED = 'opened',
    MODAL_CLOSING = 'closing',
    MODAL_CLOSED = 'closed',
}


const DEFAULT_ANIMATION_DURATION = 150;

const HARDWARE_BACK_PRESS_EVENT = 'hardwareBackPress';

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 10,
        width: screenWidth,
        height: screenHeight
    },
    modal: {
        backgroundColor: '#ffffff',
    },
    hidden: {
        top: -10000,
        left: 0,
        height: 0,
        width: 0,
    },
    draggableView: {
        flex: 1,
    },
});

export type ModalAnimationType = SlideAnimation | FadeAnimation;

export type ModalProps = {
    animationDuration?: number,
    children?: any,
    hasOverlay?: boolean,
    viewHeight?: number,
    modalAnimation?: ModalAnimationType,
    modalStyle?: StyleProp<any>,
    onDismiss?: () => void,
    onHardwareBackPress?: () => void
    onShow?: () => void
    onTouchOutside?: () => void
    overlayBackgroundColor?: string
    overlayOpacity?:number,
    overlayPointerEvents?: any
    style?: StyleProp<any>
    swipeThreshold?: number | undefined
    useNativeDriver?: boolean
    visible?: boolean
    viewWidth?: number
}
const Modal = (props : ModalProps) => {
    const {
        children,
        onTouchOutside,
        hasOverlay= true,
        modalStyle,
        animationDuration = DEFAULT_ANIMATION_DURATION,
        overlayOpacity = 0.5,
        useNativeDriver = false,
        overlayBackgroundColor,
        style,
        overlayPointerEvents,
        viewHeight,
        viewWidth,
        onHardwareBackPress,
        onDismiss,
        visible = false,
        onShow,
    } = props;

    const backdrop = useRef({setOpacity: (_: number) => {}});
    const [modalState, setModalState] = useState(MODAL_STATE.MODAL_CLOSED);
    const modalAnimation = useRef(props.modalAnimation || new FadeAnimation({
        animationDuration: animationDuration,
    }))?.current

    const overlayVisible = hasOverlay && [MODAL_STATE.MODAL_OPENING, MODAL_STATE.MODAL_OPENED].includes(modalState);
    const hidden = modalState === MODAL_STATE.MODAL_CLOSED && styles.hidden;

    useEffect(() => {
        BackHandler.addEventListener(HARDWARE_BACK_PRESS_EVENT, onBackHandler);
        return () => {
            BackHandler.removeEventListener(HARDWARE_BACK_PRESS_EVENT, onBackHandler);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            show();
        } else {
            dismiss();
        }
    }, [visible]);

    useEffect(() => {
        if(modalState === MODAL_STATE.MODAL_OPENING){
            modalAnimation.in(() => {
                setModalState(MODAL_STATE.MODAL_OPENED);
                onShow?.();
            });
        } else if(modalState === MODAL_STATE.MODAL_CLOSING){
            modalAnimation.out(() => {
                setModalState(MODAL_STATE.MODAL_CLOSED);
                onDismiss?.();
            });
        }
    }, [modalState]);

    const onBackHandler = () => {
        onHardwareBackPress && onHardwareBackPress();
        return true;
    }
    const pointerEvents = () => {
        if (overlayPointerEvents) {
            return overlayPointerEvents;
        }
        return modalState === MODAL_STATE.MODAL_OPENED ? 'auto' : 'none';
    }

    const modalSize = (): ({ width: number | undefined, height: number | undefined }) => {
        if(viewHeight && viewWidth){
            let widthSize = viewWidth
            let heightSize = viewHeight
            if (viewWidth && viewWidth > 0.0 && viewWidth <= 1.0) {
                widthSize *= screenWidth;
            }
            if (heightSize && heightSize > 0.0 && heightSize <= 1.0) {
                heightSize *= screenHeight;
            }
            return { width: widthSize, height: heightSize };
        } else{
            return { width: undefined, height: undefined };
        }
    }

    const show = () => {
        setModalState(MODAL_STATE.MODAL_OPENING)
    }

    const dismiss = () => {
       setModalState(MODAL_STATE.MODAL_CLOSING)
    }

    return (
        <View style={[styles.container, hidden]}>
            <DraggableView style={StyleSheet.flatten([styles.draggableView, style])}>
                {({ onLayout }:any) => (
                    <>
                        <Backdrop
                            ref={backdrop}
                            pointerEvents={pointerEvents()}
                            visible={overlayVisible}
                            onPress={onTouchOutside}
                            backgroundColor={overlayBackgroundColor}
                            opacity={overlayOpacity}
                            animationDuration={animationDuration}
                            useNativeDriver={useNativeDriver}/>
                        <Animated.View
                            onLayout={onLayout}>
                            <Animated.View
                                style={[
                                    styles.modal,
                                    modalSize(),
                                    modalStyle,
                                    modalAnimation.getAnimations(),
                                ]}>
                                    {children}
                            </Animated.View>
                        </Animated.View>
                    </>
                )}
            </DraggableView>
        </View>
    );
}
export default Modal;
