import {Alert, ImageProps, Linking, TouchableOpacity} from "react-native";
import * as React from "react";
import {
    ContactMethodModel,
    ContactMethodType,
    ContactPhoneMethodModel, ContactSmsMethodModel
} from "@skedulo/mex-types";
import StylesManager from "../mex/StylesManager";
import BottomSheet from "../mex/common/plugins/BottomSheet";
import Expressions from "../mex/common/expression/Expressions";
import Clipboard from '@react-native-clipboard/clipboard';
import {String} from "../mex/common/String";
import {translate} from "../mex/assets/LocalizationManager";
import FastImage from "react-native-fast-image";

const ContactMethodView = ({method, style, dataContext}: {
    method: ContactMethodModel,
    dataContext: any,
    style?: ImageProps
}) => {

    let styleConst = StylesManager.getStyleConst()

    let getIconSource = function (type: ContactMethodType) {
        switch(type) {
            case "sms":
                return require("../img/Message.png")
            case "phone":
                return require("../img/Phone.png")
        }
    }

    function onContactPressed() {
        let title: string;
        let contactValue: string = "";

        if (method.type == "phone") {
            contactValue = (method as ContactPhoneMethodModel).phoneNumberExpression
        }
        else if (method.type == "sms") {
            contactValue = (method as ContactSmsMethodModel).phoneNumberExpression
        }

        contactValue = Expressions.getValueExpression({expressionStr: contactValue, dataContext: dataContext})

        switch(method.type) {
            case "sms":
                title = String.format(translate('builtin_sms_format'), contactValue)
                break
            case "phone":
                title = String.format(translate('builtin_phone_format'), contactValue)
                break
        }

        BottomSheet.showBottomSheetWithOptions({
            options: [title, translate('builtin_copy'), translate('builtin_cancel')],
            cancelButtonIndex: 2,
        }, (chosenIndex) => {
            if (chosenIndex === 0) {
                let actionUri: string = "";

                switch(method.type) {
                    case "sms":
                        actionUri = "sms://" + contactValue
                        break
                    case "phone":
                        actionUri = "tel://" + contactValue
                        break
                }

                if (!Linking.canOpenURL(actionUri)) {
                    Alert.alert(
                        translate('builtin_invalid'),
                        String.format(translate('builtin_sms_format'), contactValue)
                    );
                } else {
                    Linking.openURL(actionUri)
                }
            }

            else if (chosenIndex === 1) {
                Clipboard.setString(contactValue)
            }
        });
    }

    return (
        <TouchableOpacity
            onPress={onContactPressed}>
            <FastImage
                source={getIconSource(method.type)}
                style={[style, {height: 25, width: 25, marginRight: styleConst.betweenTextSpacing}]}/>
        </TouchableOpacity>
    )
}

export default ContactMethodView;
