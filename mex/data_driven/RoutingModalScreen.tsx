import * as React from 'react'
import {
    View,
} from 'react-native';
import NavigationProcessManager from "../common/NavigationProcessManager";
import StylesManager from "../StylesManager";
import ThemeManager from "../colors/ThemeManager";
import {BottomModal} from "../../components/AnimationModal";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SkedButton from "../../components/SkedButton";
import {translate} from "../assets/LocalizationManager";
import {makeAutoObservable} from "mobx";
import {
    FlatContentViewRenderer,
    FlatPageContentViewRefFunctions
} from "../../components/CoreUIRenderers/FlatContentViewRenderer";
import {useCallback, useRef} from "react";
import Expressions from "../common/expression/Expressions";
import {RoutingPageDef} from "@skedulo/mex-types";

type Props = {
    route: any,
    navigation: any
}

const RoutingModalScreen: React.FC<Props> = ({route}) => {
    // Page data store as ref, so in case InstanceDataContext is changed, it won't lose the current data
    const jsonDef = route.params.jsonDef as RoutingPageDef

    let styleConst = StylesManager.getStyleConst()

    let flatPageContentViewRefFunctions = useRef<FlatPageContentViewRefFunctions>(null)

    let dataContext = {...route.params.dataContext }

    if (!dataContext.pageData) {
        dataContext.pageData = {}
    }

    dataContext = makeAutoObservable(dataContext)

    let colors = ThemeManager.getColorSet()

    let onTouchOutSide = function() {
        NavigationProcessManager.goBack(null)
    }

    let submitData = useCallback(async () => {

        let validationResult = await flatPageContentViewRefFunctions.current!.validate!()

        if (!validationResult) {
            return
        }

        NavigationProcessManager.goBack(dataContext.pageData)
    }, [dataContext])

    const safeAreaInsets = useSafeAreaInsets();

    return (
        <BottomModal
            visible
            onTouchOutside={onTouchOutSide}
            modalStyle={{ backgroundColor: colors.white, borderTopLeftRadius: 8, borderTopRightRadius: 8, }}>

            <View
                style={{
                    maxHeight: 500,
                    marginBottom: safeAreaInsets.bottom
                }}>

                <FlatContentViewRenderer
                    ref={flatPageContentViewRefFunctions}
                    navigationContext={route.params.navigationContext}
                    dataContext={dataContext}
                    items={jsonDef.ui!.items}
                    description={jsonDef.ui!.description}/>


                <View style={{
                    marginHorizontal: styleConst.defaultHorizontalPadding,
                    marginTop: styleConst.defaultVerticalPadding
                }}>
                    <SkedButton
                        onPress={submitData}
                        theme="default"
                        textPromiseFn={() => jsonDef.ui!.submitText
                            ? Expressions.generateGetValueFromLocalizationExpressionFunc({
                                dataContext: dataContext,
                                expressionStr: jsonDef.ui!.submitText
                            })()
                            : Promise.resolve(translate("builtin_next"))}/>
                </View>
            </View>
        </BottomModal>
    )
}

export default RoutingModalScreen
