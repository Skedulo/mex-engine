import lodash from "lodash";
import {FetchValueExpression} from "./expression/Expressions";
import {format} from "date-fns-tz";
import moment from "moment";
import {PermissionsAndroid, Platform} from "react-native";
import CoreV3UIModuleMapper from "./modules/CoreV3UIModuleMapper";
import {translate} from "../assets/LocalizationManager";

let utils = {
    data: {

        generateUniqSerial(tempName?: string|undefined) {
            tempName = tempName ?? 'temp'

            return tempName + '-xxxx-xxxx-xxx-xxxx'.replace(/[x]/g, (_) => {
                const r = Math.floor(Math.random() * 16);
                return r.toString(16);
            });
        },

        cloneObject(data: any) {
            return lodash.cloneDeep(data);
        }
    },

    date : {
        now: function(mode: string|undefined) {
            if (!mode || mode == "date") {
                return format(new Date(), 'yyyy-MM-dd')
            }

            return moment(new Date()).toISOString(false)
        }
    },

    misc: {
        checkIsVisible: function({jsonDef, dataContext}: {jsonDef: any, dataContext: any}) {
            if (jsonDef.isVisible) {
                return new FetchValueExpression({expressionStr: jsonDef.isVisible, dataContext}).getValue()
            }

            return true
        }
    },

    fileSize: {

        humanFileSize: function (bytes: number, si = false, dp = 1) {
            const thresh = si ? 1000 : 1024;

            if (Math.abs(bytes) < thresh) {
                return bytes + ' B';
            }

            const units = si
                ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
                : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
            let u = -1;
            const r = 10 ** dp;

            do {
                bytes /= thresh;
                ++u;
            } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


            return bytes.toFixed(dp) + ' ' + units[u];
        }
    },
    permission: {
        requestCameraPermission: async () => {
            if (Platform.OS === 'ios') {
                // react native image picker ios will handle permission for us
                return true
            }
            // handle android camera permission
            const resultRequestPermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
            )
            if (resultRequestPermission === PermissionsAndroid.RESULTS.GRANTED) {
                return true
            } else {
                CoreV3UIModuleMapper.showMessage(translate('builtin_need_permission_to_use_camera'),"default")
                return false
            }
        }
    }
}

export default utils

