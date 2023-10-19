import React from "react";
import {Text, TouchableOpacity, View} from "react-native";
import InternalUtils from "../mex/common/InternalUtils";
import StylesManager from "../mex/StylesManager";

type Props = {
    onRetry: () => void,
    errorMessage?: string,
    errorDetails?: string
}

const LoadingDataErrorView:  React.FC<Props> = ({onRetry, errorDetails, errorMessage}) => {

    let styles = StylesManager.getStyles()

    return (
        <View style={{flex: 1, justifyContent: "center"}}>
            <Text style={[styles.textHeadingBold, {alignSelf: "center", fontSize: 25}]}>Oops.... Something went wrong</Text>
            <Text
                style={[styles.textRegular,
                    {
                        alignSelf: "center",
                        textAlign: "center",
                        marginTop: 15,
                        paddingLeft: 20, paddingRight: 20
                    }
                ]}>
                {errorMessage ?? "We're sorry but there is something wrong when loading data."}
            </Text>

            <Text
                style={[styles.textCaption,
                    {
                        alignSelf: "center",
                        textAlign: "center",
                        marginTop: 15,
                        paddingLeft: 20, paddingRight: 20
                    }
                ]}
                numberOfLines={15}>
                {errorDetails ?? ""}
            </Text>

            <View style={{marginTop: 15}}>

                <TouchableOpacity style={{ ...styles.button, alignSelf: "center", width: 250}} onPress={onRetry}>
                    <Text style={{...styles.buttonInsideText, alignSelf: "center"}}>Retry</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ ...styles.buttonDefault, marginTop: 10, alignSelf: "center", width: 250}} onPress={() => InternalUtils.navigation.exit()}>
                    <Text style={{...styles.buttonDefaultInsideText, alignSelf: "center"}}>Go back</Text>
                </TouchableOpacity>
            </View>
        </View>)

}

export default LoadingDataErrorView
