import {Appearance, ColorSchemeName} from "react-native";
import LightColors from "./LightColors";
import DarkColors from "./DarkColors";
import StylesManager from "../StylesManager";
import {SkedColorSet} from "./SkedColorSet";
import { IThemeManager } from "@skedulo/mex-engine-proxy";
class ThemeManager implements IThemeManager {

    _colorSet: SkedColorSet = LightColors
    _callbacks: ((colorScheme:ColorSchemeName) => void)[] = []

    constructor() {
    }

    initializeColors() {
        this._colorSet = Appearance.getColorScheme() === 'light' ? LightColors : DarkColors;
        StylesManager.initializeStyles();

        Appearance.addChangeListener(preferences => {
            this._colorSet = preferences.colorScheme === 'light' ? LightColors : DarkColors;
            StylesManager.initializeStyles();

            this.triggerThemeChange(preferences.colorScheme)
        })
    }

    registerThemeChangedCallback(callback:(colorScheme:ColorSchemeName) => void) {
        this._callbacks.push(callback)
    }

    removeThemeChangedCallBack(callback:(colorScheme:ColorSchemeName) => void) {
        let index = this._callbacks.indexOf(callback)

        if (index !== -1) {
            this._callbacks.slice(index, 1)
        }
    }

    triggerThemeChange(colorScheme: ColorSchemeName) {
        this._callbacks.forEach(c => c(colorScheme))
    }

    getTheme(): ColorSchemeName {
        return Appearance.getColorScheme()
    }

    getColorSet(): SkedColorSet {
        return this._colorSet
    }
}


export default new ThemeManager() as ThemeManager
