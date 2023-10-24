import * as React from 'react';
import {useCallback, useRef, useState} from 'react';
import {
    AppRegistry,
    View,
    ActivityIndicator,
    ColorSchemeName,
    LogBox
} from 'react-native';
import {createNavigationContainerRef, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {generateNavigationRef} from './mex/common/RootNavigation';
import ThemeManager from './mex/colors/ThemeManager'
import LocalizationManager from "./mex/assets/LocalizationManager";
import SelectScreen, {SelectScreenName} from "./mex/common/screens/select/SelectScreen";
import AssetsManager from './mex/assets/AssetsManager'
import WithManageTheme, {ThemeContext} from "./mex/data_driven/WithManageTheme";
import WithManageInstanceData, {InstanceDataContext} from "./mex/data_driven/WithManageInstanceData";
import LoadingDataErrorView from "./components/LoadingDataErrorView";
import AttachmentsManager from "./mex/common/attachments/AttachmentsManager";
import MexEngineScreen from "./mex/data_driven/MexEngineScreen";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import ScanQRBarCodeScreen from "./mex/common/screens/ScanQRBarCodeScreen";
import CaptureSignatureScreen from "./mex/common/screens/CaptureSignatureScreen";
import BodyMapScreen from "./components/BodyMapScreen";
import RoutingModalScreen from "./mex/data_driven/RoutingModalScreen";
import ErrorBoundary from "react-native-error-boundary";
import LogManager from "./mex/common/LogManager";
import InternalUtils from "./mex/common/InternalUtils";
import SkedButton from "./components/SkedButton";
import NavigationProcessManager from "./mex/common/NavigationProcessManager";
import {
    ComponentsProxy,
    CoreContainer,
    ContextProxy,
    CustomComponentRegistry,
    ExpressionProxy,
    ServicesProxy, HooksProxy, INativeHooks, UtilsProxy
} from "@skedulo/mex-engine-proxy";
import ExpressionFunctions from "./mex/common/expression/Expressions";
import {InternalUtilsType} from "@skedulo/mex-engine-proxy/dist/src/proxies/services/interfaces";
import {IAPIHooks} from "@skedulo/mex-engine-proxy/dist/src/proxies/hooks/interfaces";
import {useSkedAPI} from "./mex/hooks/useAPI";
import {useAccessToken} from "./mex/hooks/useAccessToken";
import {useBaseUrl} from "./mex/hooks/useBaseUrl";
import {ExtHelperImpl} from "./mex/common/utils/ExtHelper";
LogBox.ignoreLogs(['Warning: ...', '[MobX]', 'Require cycle', 'Could not find image']); // Ignore log notification by message

const Stack = createNativeStackNavigator();

type RootStackArgs = {
    packageId: string,
    contextId: string,
    staticResourcesId: string
    formName: string
}

const RootStack = ({packageId, formName, contextId, staticResourcesId} : RootStackArgs) => {

    const navigationRef = useRef(createNavigationContainerRef())

    generateNavigationRef(navigationRef.current);

    const logError = useCallback((e: Error, stack:string) => { LogManager.logError(e, stack) }, [])

    let [_, setTheme] = useState(ThemeManager.getTheme());

    ThemeManager.initializeColors()
    ThemeManager.registerThemeChangedCallback((colorScheme: ColorSchemeName) => {
        setTheme(colorScheme)
    })

    let colors = ThemeManager.getColorSet();

    // Initialize JSON Defs
    let [isLoaded, setIsLoaded] = useState(false)
    let [error, setHasError] = useState<{reason: string, hasError: boolean}>({reason: "", hasError: false})

    if (error.hasError) {
        return (
            <LoadingDataErrorView errorDetails={error.reason} onRetry={() => {
                setIsLoaded(false)
                setHasError({reason: "", hasError: false})
            }} />)
    }

    let registeredModules = useRef<CustomComponentRegistry[]>([])

    if (!isLoaded)
    {
        AssetsManager.initialize({packageId, formName, contextId, staticResourcesId}, {utils: InternalUtils as InternalUtilsType})
        AttachmentsManager.initialize()

        // Initialize Localization
        Promise.all([
            LocalizationManager.initializeLocalization(),
            AssetsManager.loadMexData(),
            scanModulePages().then((registries) => {
                registeredModules.current = registries ?? []
            })
        ])
            .then((_) => {
                setIsLoaded(true)
            })
            .catch((err) => {
                console.log("error when loading -", err)

                setHasError({reason: err.message ?? "", hasError: true})
            });

        return  (
            <View style={{flex: 1, justifyContent: "center"}}>
                <ActivityIndicator style={{alignSelf: "center"}} size="large" color={colors.skedBlue900} />
            </View>)
    }

    let uiDefinitions: any = AssetsManager.getResources().jsonDef

    let pagesDef: JSX.Element[] = []

    for(let key of Object.keys(uiDefinitions.pages)) {
        let page = uiDefinitions.pages[key]

        if (page.type == 'custom')
            continue

        pagesDef.push(<Stack.Screen
            key={key}
            name={key as never}
            options={{
                title: page.title,
                gestureEnabled: false
            }}
            component={MexEngineScreen}
            initialParams={{pageId: key, firstPage: key === uiDefinitions.firstPage}}
        />)
    }

    registeredModules.current.forEach(module => {
        let screens = module.getRegisteredScreens()
        screens.forEach(screen => {
            let screenKey = module.resolveScreenKey(screen)

            console.log("screenKey", screenKey, uiDefinitions.firstPage)

            pagesDef.push(<Stack.Screen
                key={screenKey}
                name={screenKey as never}
                options={{
                    gestureEnabled: false
                }}
                component={screen.screen}
                initialParams={{pageId: screenKey, firstPage: screenKey === uiDefinitions.firstPage}}
            />)
        })
    })

    return (
        <ErrorBoundary
            onError={logError}
            FallbackComponent={RootErrorFallbackComponent}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <WithManageTheme>
                    <WithManageInstanceData>
                        <NavigationContainer ref={navigationRef.current}>
                            <Stack.Navigator
                                initialRouteName={uiDefinitions.firstPage}
                                screenOptions={{
                                    contentStyle: {
                                        backgroundColor: colors.skeduloBackgroundGrey
                                    },
                                    headerTintColor: colors.white,
                                    headerStyle: {
                                        backgroundColor: colors.skeduloBlue,
                                    },
                                }}>

                                {pagesDef}

                                <Stack.Screen
                                    name={SelectScreenName as never}
                                    component={SelectScreen}
                                    options={{
                                        presentation: 'transparentModal',
                                        headerShown: false,
                                        gestureEnabled: false,
                                        headerStyle: {
                                            backgroundColor: 'transparent'
                                        },
                                        contentStyle: {
                                            backgroundColor: 'transparent'
                                        },
                                        animation: "none"
                                    }}
                                />

                                <Stack.Screen
                                    name="scanQRBarcodeScreen"
                                    component={ScanQRBarCodeScreen}
                                    options={{
                                        headerShown: false,
                                        presentation: 'fullScreenModal',
                                    }}
                                />

                                <Stack.Screen
                                    name="captureSignatureScreen"
                                    component={CaptureSignatureScreen}
                                    options={{
                                        headerShown: true,
                                        presentation: 'fullScreenModal',
                                    }}
                                />

                                <Stack.Screen
                                    name="bodyMapScreen"
                                    component={BodyMapScreen}
                                    options={{
                                        headerShown: false,
                                        presentation: 'fullScreenModal',
                                        contentStyle: {
                                            backgroundColor: ThemeManager.getColorSet().skedBlue900
                                        },
                                    }}
                                />

                                <Stack.Screen
                                    name="routingModalScreen"
                                    component={RoutingModalScreen}
                                    options={{
                                        presentation: 'transparentModal',
                                        headerShown: false,
                                        gestureEnabled: false,
                                        headerStyle: {
                                            backgroundColor: 'transparent'
                                        },
                                        contentStyle: {
                                            backgroundColor: 'transparent'
                                        },
                                        animation: "none"
                                    }}
                                />

                            </Stack.Navigator>
                        </NavigationContainer>
                    </WithManageInstanceData>
                </WithManageTheme>
            </GestureHandlerRootView>
        </ErrorBoundary>);
}

const RootErrorFallbackComponent = (props: { error: Error, resetError: Function }) => {
    return (<LoadingDataErrorView
        errorMessage={props.error.message}
        errorDetails={__DEV__ ? (props.error.stack ?? "") : ""}
        onRetry={() => props.resetError()}/>)
}

// Register services
const registerServices = () => {
    CoreContainer.bind(ContextProxy.ThemeContext).toConstant(ThemeContext)
    CoreContainer.bind(ContextProxy.InstanceContext).toConstant(InstanceDataContext)

    CoreContainer.bind(ComponentsProxy.SkedButton).toConstant(SkedButton)

    CoreContainer.bind(ServicesProxy.AssetsManager).toConstant(AssetsManager)
    CoreContainer.bind(ServicesProxy.NavigationProcessManager).toConstant(NavigationProcessManager)
    // @ts-ignore
    CoreContainer.bind(ServicesProxy.InternalUtils).toConstant(InternalUtils as InternalUtilsType)

    CoreContainer.bind(ExpressionProxy.ExpressionFunctions).toConstant(ExpressionFunctions)

    let apiHooks = {
        useSkedAPI: useSkedAPI
    } as IAPIHooks
    CoreContainer.bind(HooksProxy.APIHooks).toConstant(apiHooks)

    let nativeHooks = {
        useAccessToken: useAccessToken,
        useBaseUrl: useBaseUrl
    } as INativeHooks
    CoreContainer.bind(HooksProxy.NativeHooks).toConstant(nativeHooks)

    CoreContainer.bind(UtilsProxy.ExtHelper).toConstant(new ExtHelperImpl())
}

registerServices();

// Module name
AppRegistry.registerComponent('RNHighScores', () => RootStack);
AppRegistry.registerComponent('MexApp', () => RootStack);

async function scanModulePages(): Promise<CustomComponentRegistry[]> {
}
