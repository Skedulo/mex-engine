import ThemeManager from './colors/ThemeManager'
import {Platform} from "react-native";

type StyleConstant = {
    defaultHorizontalPadding: number
    defaultVerticalPadding: number,
    smallVerticalPadding: number,
    componentVerticalPadding: number,
    betweenTextSpacing: number,
    captionTextSize: number,
    betweenComponentVerticalSpacing: number
}

class StylesManager {
    styles: any;
    stylesConstant: StyleConstant = {
        defaultHorizontalPadding: 16,
        defaultVerticalPadding: 16,
        smallVerticalPadding: 8,
        componentVerticalPadding: 12,
        betweenTextSpacing: 6,
        captionTextSize: 12,
        betweenComponentVerticalSpacing: 32
    };

    initializeStyles() {
        let colors = ThemeManager.getColorSet()

       this.styles =  {
           text: {
               "color": colors.skeduloText,
               "fontSize": 20,
           },

           errorText: {
               "color": colors.red800,
               "fontSize": 14,
           },
           textRegular: {
               fontWeight: "normal",
               fontSize: 16,
               flexWrap: 'wrap',
               color: colors.skeduloText
           },
           textTitleListItem: {
               fontWeight: "600",
               fontSize: 16,
               color: colors.skeduloText
           },
           textCaptionListItem: {
               fontWeight: "normal",
               fontSize: 16,
               color: colors.navy600
           },
           textCaptionSelector: {
               fontWeight: "normal",
               fontSize: 14,
               color: colors.navy600
           },
           textCaption: {
               fontWeight: "normal",
               fontSize: 12,
               flexWrap: 'wrap',
               color: colors.skeduloText
           },
           textMedium: {
               fontWeight: "500",
               fontSize: 16,
               color: colors.skeduloText
           },

           textHeadingBold: {
               fontWeight: "bold",
               fontSize: 18,
               color: colors.skeduloText
           },

           navigationTitle: {
               fontSize: 16,
               fontWeight: "bold"
           },

           navigationSubtitle: {
               fontSize: 14
           },
           editText: {
               borderColor: colors.navy300,
               borderWidth: 1,
               borderRadius: 2,
               marginTop: 8,
               height: 48,
               fontSize: 16,
               paddingHorizontal: 16,
               justifyContent: 'center',
               color: colors.skeduloText,
           },
           selector: {
               borderWidth: 1,
               borderRadius: 2,
               marginTop: 8,
               height: 48,
               paddingHorizontal: 16,
           },
           searchBarTextContainer: {
               borderColor: colors.navy100,
               backgroundColor: colors.navy75,
               borderWidth: 1,
               borderRadius: 10,
               paddingHorizontal: 12,
           },
           searchBarText: {
               backgroundColor: "transparent",
               borderWidth: 0,
               borderRadius: 0,
               paddingHorizontal: 12,
               paddingTop: 12,
               paddingBottom: 12,
               color: colors.skeduloText
           },
           button: {
               backgroundColor: colors.skeduloBlue,
               height: 44,
               borderRadius: 8,
               paddingVertical: 10,
               paddingHorizontal: 12,
               justifyContent: "center"
           },
           buttonSmall: {
               backgroundColor: colors.skeduloBlue,
               borderRadius: 8,
               justifyContent: "center",
               height: 32,
               paddingVertical: 8,
               paddingHorizontal: 20
           },
           buttonDefault: {
               height: 44,
               borderRadius: 8,
               paddingVertical: 10,
               paddingHorizontal: 12,
               justifyContent: "center",
               borderColor: colors.skeduloBlue,
               borderWidth: 1
           },
           headerButtonText: {
               fontSize: 16,
               color: colors.white,
               fontWeight: 'normal',
               alignSelf: 'center',
           },
           buttonInsideText: {
               fontSize: 16,
               color: colors.white,
               fontWeight: "600",
               alignSelf: "center",
           },
           buttonSmallInsideText: {
               fontSize: 14,
               color: colors.white,
               fontWeight: "600",
               alignSelf: "center",
           },
           buttonDefaultInsideText: {
               fontSize: 16,
               color: colors.skeduloBlue,
               fontWeight: "500",
               alignSelf: "center",
           },

           buttonLinkText: {
               fontSize: 16,
               color: colors.skeduloText,
               fontWeight: "500",
               alignSelf: "center",
           },

           headerButton: {
               color: colors.white
           },
           headerButtonAlt: {
               color: colors.skedBlue800
           },
           checkBoxProps: {
               size: 25,
               useNativeDriver: true,
               unfillColor: colors.white,
               disableBuiltInState: true,
               iconStyle: {
                   borderRadius: Platform.OS === 'ios' ? 13 : 5
               }
           },
           headerBarSelectView: {
               borderRadius: 8,
               flexDirection: 'row',
               justifyContent:'space-between',
               paddingTop: 19,
               paddingBottom:15,
               paddingHorizontal: 16
           }
       }
    }

    getStyles() { return this.styles }
    getStyleConst() : StyleConstant { return this.stylesConstant }

}

export default new StylesManager() as StylesManager

