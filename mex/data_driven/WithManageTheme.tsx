import * as React from 'react';
import {useEffect, useState} from 'react';
import ThemeManager from "../colors/ThemeManager";
import {ColorSchemeName} from "react-native";

export const ThemeContext:React.Context<ColorSchemeName> = React.createContext(ThemeManager.getTheme());

export type Props = {
    children: JSX.Element,
}

let WithManageTheme: React.FC<Props> = ({ children }) => {
    let [theme, setTheme] = useState(ThemeManager.getTheme())

    let themeChanged = function (newTheme: ColorSchemeName) {
        setTheme(newTheme)
    }

    useEffect(() => {
        ThemeManager.registerThemeChangedCallback(themeChanged)

        return () => {
            ThemeManager.removeThemeChangedCallBack(themeChanged)
        }
    })

    return (<ThemeContext.Provider value={theme}>
        {children}
    </ThemeContext.Provider>)
}

export default WithManageTheme
