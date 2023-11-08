// import React, {useEffect, useState} from 'react'
// import {ActivityIndicator, SafeAreaView} from "react-native";
// import LinearGradient from 'react-native-linear-gradient';
// import {DrawWithOptions} from "./Bodymap";
// import NavigationProcessManager from "../mex/common/NavigationProcessManager";
// import AssetsManager from "../mex/assets/AssetsManager";
// import ThemeManager from "../mex/colors/ThemeManager";
//
// type Props = {
//     route: any,
//     navigation: any
// }
//
// const BodyMapScreen: React.FC<Props> = ({ route}) => {
//
//     let { imageSource } = route.params.pageData;
//     let [accessToken, setAccessToken] = useState('')
//
//     if (typeof imageSource === 'string' || imageSource instanceof String) {
//         imageSource = {
//             uri: imageSource,
//             headers: {
//                 Authorization: 'Bearer ' + accessToken
//             }
//         }
//
//         useEffect(() => {
//             AssetsManager.getAccessToken()
//                 .then((accessToken) => {
//                     setAccessToken(accessToken)
//                 })
//         }, [imageSource])
//     } else {
//         accessToken = "dummy"
//     }
//
//     const closePage = function() {
//         NavigationProcessManager.goBack( null)
//     }
//
//     const takeSnapShotAndLeave = function(uri: string|undefined) {
//         NavigationProcessManager.goBack(uri)
//     }
//
//     return (
//         <SafeAreaView style={{flex: 1}}>
//             {accessToken
//             ?   <DrawWithOptions
//                     linearGradient={LinearGradient}
//                     image={imageSource}
//                     close={closePage}
//                     takeSnapshot={snap => {
//                         snap.then(takeSnapShotAndLeave);
//                     }}
//                 />
//                 : <ActivityIndicator
//                     style={{position: "absolute"}}
//                     color={ThemeManager.getColorSet().skedBlue900} size="small" />}
//
//         </SafeAreaView>
//     )
// }
//
// export default BodyMapScreen
