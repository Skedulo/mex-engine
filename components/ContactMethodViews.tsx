import * as React from "react";
import {ContactMethodModel} from "@skedulo/mex-types";
import {StyleProp, View, ViewStyle} from "react-native";
import ContactMethodView from "./ContactMethodView";

const ContactMethodViews = ({methods, style, dataContext}: {
    methods: ContactMethodModel[],
    style?: StyleProp<ViewStyle>,
    dataContext: any,
}) => {

    if (!methods) {
        return null
    }

    return (
        <View style={[style, {flexDirection: "row"}]}>
            {methods.map(method => (<ContactMethodView dataContext={dataContext} method={method} key={method.type} />))}
        </View>
    )
}

export default ContactMethodViews;
