import React, {useLayoutEffect, useRef, useState} from 'react'
import {
    findNodeHandle,
    KeyboardAvoidingView, Platform,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import SkedIcon, {IconTypes} from "../../../components/SkedIcon";
import NavigationProcessManager from "../NavigationProcessManager";
import ThemeManager from "../../colors/ThemeManager";
import converters from "../Converters";
import SkedButton from "../../../components/SkedButton";
import CaptureSignatureView from "../../../components/CaptureSignatureView";
import StylesManager from "../../StylesManager";
import {isTablet} from 'react-native-device-info';

type Props = {
    route: any,
    navigation: any
}

const CaptureSignatureScreen: React.FC<Props> = ({navigation, route}) => {
    const [hasDrawing, setHasDrawing] = useState(false)
    const [fullName, setFullName] = useState("")
    const [isFocus, setIsFocus] = useState(false)

    const captureSignatureViewRef = useRef<number | null>(null);

    let colors = ThemeManager.getColorSet()

    const {enableFullName} = route.params;

    let styleConst = StylesManager.getStyleConst()

    let onSignatureSaved = function (data: any): void {
        NavigationProcessManager.goBack({imageUrl: data.nativeEvent.imageUrl, fullName: fullName})
    }

    let onSignatureChanged = function (data: any): void {
        if (data.nativeEvent.hasDrawing != hasDrawing) {
            setHasDrawing(data.nativeEvent.hasDrawing)
        }
    }

    let cancel = function (): void {
        NavigationProcessManager.goBack()
    }

    let saveSignature = function (): void {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(captureSignatureViewRef.current),
            "saveSignature",
            [])
    }

    let clearSignature = function (): void {
        UIManager.dispatchViewManagerCommand(
            findNodeHandle(captureSignatureViewRef.current),
            "clearSignature",
            [],
        );

        setFullName("")
    }

    useLayoutEffect(() => {

        applyHeaderDef()

    }, [navigation])

    const handleOnFocus = () => {
        setIsFocus(true)
    }

    const handleOnBlur = () => {
        setIsFocus(false)
    }

    return (

        <SafeAreaView
            style={{
                height: "100%",
                width: "100%"
            }}>
            <View
                style={{flex: 1}}>

                <View
                    style={{
                        position: "absolute",
                        height: isTablet() ? "80%" : 450,
                        width: "100%",
                        marginTop: styleConst.defaultVerticalPadding,
                        paddingHorizontal: styleConst.defaultHorizontalPadding,
                    }}>
                    <CaptureSignatureView
                        style={{
                            height: "100%",
                            width: "100%",
                            backgroundColor: "transparent"
                        }}
                        ref={captureSignatureViewRef}
                        onSignatureChanged={onSignatureChanged}
                        onSignatureSaved={onSignatureSaved}/>
                </View>

                <KeyboardAvoidingView
                    pointerEvents={"box-none"}
                    style={{
                        flex: 1,
                        justifyContent: 'flex-end',
                    }}
                    behavior={Platform.OS == 'ios' ? "padding" : undefined}>
                    <View
                        style={{
                            paddingTop: styleConst.defaultVerticalPadding,
                            paddingHorizontal: styleConst.defaultHorizontalPadding,
                            backgroundColor: colors.skeduloBackgroundGrey
                        }}>

                        {!enableFullName ? null :
                            <TextInput
                                editable={true}
                                placeholder={converters.localization.translate("builtin_signature_fullname_placeholder")}
                                style={[
                                    StylesManager.getStyles().editText,
                                    {
                                        marginBottom: styleConst.defaultVerticalPadding,
                                        borderColor: isFocus ? colors.skedBlue800 : colors.navy100,
                                    }]}
                                onFocus={handleOnFocus}
                                onBlur={handleOnBlur}
                                onChangeText={(text) => setFullName(text)}
                                underlineColorAndroid="transparent"
                            />}

                        <View>
                            <SkedButton
                                disabled={!hasDrawing}
                                theme="primary"
                                onPress={saveSignature}
                                key={"addNew"}
                                textPromiseFn={() => Promise.resolve(converters.localization.translate("builtin_signature_save"))}/>
                        </View>

                        <View
                            style={{marginTop: styleConst.defaultVerticalPadding}}>
                            <SkedButton
                                disabled={!hasDrawing}
                                theme="default"
                                onPress={clearSignature}
                                key={"addNew"}
                                textPromiseFn={() => Promise.resolve(converters.localization.translate("builtin_signature_clear"))}/>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>)


    function applyHeaderDef() {
        let options: any = {
            "title": converters.localization.translate("builtin_signature_title"),
        }

        options.headerLeft = () => {
            return (
                <TouchableOpacity
                    onPress={cancel}
                    hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
                    style={{marginRight: 10}}>
                    <SkedIcon style={{height: 24, width: 24, tintColor: ThemeManager.getColorSet().white}}
                              iconType={IconTypes.BackArrow}/>
                </TouchableOpacity>)
        }

        navigation.setOptions(options);
    }
}

export default CaptureSignatureScreen
