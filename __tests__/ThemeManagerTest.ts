import LightColors from "../mex/colors/LightColors";
import DarkColors from "../mex/colors/DarkColors";

describe('getValueFromLocalizationExpression', function () {

    beforeEach(() => {
        jest.resetModules()
    })

    it('given settings is Light - expect return LightTheme', async function () {
        jest.doMock("react-native", () => {
            let mock:any;

            mock = jest.requireActual("react-native")

            mock.Appearance.getColorScheme = () => {
                return 'light'
            }

            return mock
        })

        let themeManager = require('../mex/colors/ThemeManager').default

        themeManager.initializeColors()

        expect('light').toEqual(themeManager.getTheme())
        expect(LightColors).toEqual(themeManager.getColorSet())
    });

    it('given settings is Dark - expect return DarkTheme', async function () {

        jest.doMock("react-native", () => {
            let mock:any;

            mock = jest.requireActual("react-native")

            mock.Appearance.getColorScheme = () => {
                return 'dark'
            }

            return mock
        })

        let themeManager = require('../mex/colors/ThemeManager').default

        themeManager.initializeColors()

        expect('dark').toEqual(themeManager.getTheme())
        expect(DarkColors).toEqual(themeManager.getColorSet())
    });

});
