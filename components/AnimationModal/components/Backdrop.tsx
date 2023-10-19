
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {StyleSheet, TouchableOpacity, Animated} from 'react-native';
import ThemeManager from "../../../mex/colors/ThemeManager";

type BackdropProps = {
    backgroundColor?: string,
    opacity?: number,
    animationDuration?: number,
    visible?: boolean,
    useNativeDriver?: boolean,
    onPress?:  () => void,
    pointerEvents?: "box-none" | "none" | "box-only" | "auto"
};

const Backdrop = (props : BackdropProps, ref:any) => {
    let colors = ThemeManager.getColorSet()
    const animated = useRef(new Animated.Value(0)).current;
    const renderCount = useRef(0);
    const { onPress , pointerEvents = "none", backgroundColor= colors.overlayColor, visible = false, useNativeDriver = false, opacity = 0.5, animationDuration } = props;

    const setOpacity = (initialValue: number) => {
        animated.setValue(initialValue)
    }

    useImperativeHandle(ref, () => ({setOpacity}));

    useEffect(() => {
        renderCount.current = 1;
        if(renderCount.current) return;
        const toValue = visible ? opacity : 0;
        Animated.timing(animated, {
            toValue,
            duration: animationDuration,
            useNativeDriver,
            delay: visible ? 200 : 0
        }).start();
    }, [visible])

    return (
        <Animated.View
            pointerEvents={pointerEvents}
            style={[StyleSheet.absoluteFill, {
                backgroundColor,
                opacity,
            }]}>
            <TouchableOpacity
                onPress={onPress}
                style={StyleSheet.absoluteFill}
            />
        </Animated.View>
    )
};

export default forwardRef(Backdrop);