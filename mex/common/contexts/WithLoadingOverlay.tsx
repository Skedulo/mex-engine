import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {View} from "react-native";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import StylesManager from "../../StylesManager";
import ThemeManager from "../../colors/ThemeManager";

type LoadingOverlayDataContextType = {
    isShow: boolean,
    setIsShow:  (value: (((prevState: boolean) => boolean) | boolean)) => void
}

export const LoadingOverlayDataContext = React.createContext<LoadingOverlayDataContextType|undefined>(undefined);

export type Props = {
    children: JSX.Element,
}

const WithLoadingOverlay: React.FC<Props> = ({ children }) => {
    const [isShow, setIsShow] = useState(false);

    const value = { isShow, setIsShow } as LoadingOverlayDataContextType;

    let styles = StylesManager.getStyles()
    let colors = ThemeManager.getColorSet()

    return (<LoadingOverlayDataContext.Provider value={value}>
        <View style={{flex: 1}}>
            <SpinnerOverlay
                visible={isShow}
                textContent={'Loading...'}
                textStyle={{...styles.textMedium, color: colors.white}}
            />
            {children}
        </View>
    </LoadingOverlayDataContext.Provider>)
}

export default WithLoadingOverlay
