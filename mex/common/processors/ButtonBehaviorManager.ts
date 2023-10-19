import {Alert, Linking} from "react-native";
import Expressions from "../expression/Expressions";
import {ExtHelperImpl} from "../utils/ExtHelper";
import DeviceInfo from "react-native-device-info";
import {String} from "../String";
import {translate} from "../../assets/LocalizationManager";
import {
    ButtonBehaviorComponentModel,
    CustomFunctionButtonBehaviorComponentModel,
    EmailButtonBehaviorComponentModel,
    OpenSelectorButtonBehaviorComponentModel,
    OpenURLButtonBehaviorComponentModel,
    PhoneButtonBehaviorComponentModel,
    SMSButtonBehaviorComponentModel
} from "@skedulo/mex-types";
import {PageProcessorContextObj} from "../../hooks/useCrudOnPage";
import * as RootNavigation from "../RootNavigation";
import NavigationProcessManager from "../NavigationProcessManager";
import {SelectScreenName} from "../screens/select/SelectScreen";

type BehaviorType = IBaseBehavior|CustomBehavior|PhoneBehavior|SMSBehavior|EmailBehavior|OpenUrlBehavior

export class BehaviorManager {
    processors: BehaviorType[]

    constructor() {
        this.processors = [
            new CustomBehavior(),
            new PhoneBehavior(),
            new SMSBehavior(),
            new EmailBehavior(),
            new OpenUrlBehavior(),
            new OpenSelectorBehavior()
        ]
    }

    findProcessor(typeName: string): BehaviorType|null {
        let processor = this.processors.find(p => p.getTypeName() === typeName)

        return processor ?? null
    }
}

type BehaviorArgs = {
    jsonDef: any,
    dataContext: any,
    pageContext: PageProcessorContextObj
}

interface IBaseBehavior {
    execute(args: any): Promise<void>
    getTypeName(): string
}

abstract class BaseBehavior<TComponentDefinitionModel extends ButtonBehaviorComponentModel> implements IBaseBehavior{
    abstract innerExecute(args: BehaviorArgs, jsonDef: TComponentDefinitionModel): Promise<void>
    abstract getTypeName(): string

    execute(args: any): Promise<void> {
        return this.innerExecute(args, args.jsonDef as TComponentDefinitionModel)
    }

    async openUrl(url: string, errorMessage: string): Promise<void> {

        if(!await Linking.canOpenURL(url)) {
            Alert.alert(
                errorMessage
            )
            return
        }

        await Linking.openURL(url)
    }
}

class CustomBehavior extends BaseBehavior<CustomFunctionButtonBehaviorComponentModel> {
    async innerExecute(
        args: BehaviorArgs,
        jsonDef: CustomFunctionButtonBehaviorComponentModel): Promise<void> {
        await Expressions.getValueExpression({
            expressionStr: jsonDef.functionExpression,
            dataContext: args.dataContext,
            extras: {
                extHelper: new ExtHelperImpl(args.pageContext)
            }
        })
    }

    getTypeName(): string {
        return "custom"
    }
}

class PhoneBehavior extends BaseBehavior<PhoneButtonBehaviorComponentModel> {
    async innerExecute(
        args: BehaviorArgs,
        jsonDef: PhoneButtonBehaviorComponentModel): Promise<void> {

        if (await DeviceInfo.isEmulator()){
            Alert.alert("Emulator is not supported for calling")

            return
        }

        let result = Expressions.getValueExpression({
            expressionStr: jsonDef.phoneNumberExpression,
            dataContext: args.dataContext,
            extras: {
                extHelper: new ExtHelperImpl(args.pageContext)
            }
        })

        let phoneNumberUrl = "tel://" + result

        await this.openUrl(phoneNumberUrl,  String.format(translate('builtin_phone_number_invalid_format'), result))
    }

    getTypeName(): string {
        return "phone"
    }
}

class SMSBehavior extends BaseBehavior<SMSButtonBehaviorComponentModel> {
    async innerExecute(
        args: BehaviorArgs,
        jsonDef: SMSButtonBehaviorComponentModel): Promise<void> {

        let result = Expressions.getValueExpression({
            expressionStr: jsonDef.phoneNumberExpression,
            dataContext: args.dataContext,
            extras: {
                extHelper: new ExtHelperImpl(args.pageContext)
            }
        })

        let smsUrl = "sms://" + result

        await this.openUrl(smsUrl,  String.format(translate('builtin_phone_number_invalid_format'), result))
    }

    getTypeName(): string {
        return "sms"
    }
}

class EmailBehavior extends BaseBehavior<EmailButtonBehaviorComponentModel> {
    async innerExecute(
        args: BehaviorArgs,
        jsonDef: EmailButtonBehaviorComponentModel): Promise<void> {

        let result = Expressions.getValueExpression({
            expressionStr: jsonDef.emailExpression,
            dataContext: args.dataContext,
            extras: {
                extHelper: new ExtHelperImpl(args.pageContext)
            }
        })

        let emailUrl = "mailto:" + result

        await this.openUrl(emailUrl,  String.format(translate('builtin_email_invalid_format'), result))
    }

    getTypeName(): string {
        return "email"
    }
}

class OpenUrlBehavior extends BaseBehavior<OpenURLButtonBehaviorComponentModel> {
    async innerExecute(
        args: BehaviorArgs,
        jsonDef: OpenURLButtonBehaviorComponentModel): Promise<void> {
        let result = Expressions.getValueExpression({
            expressionStr: jsonDef.urlExpression,
            dataContext: args.dataContext,
            extras: {
                extHelper: new ExtHelperImpl(args.pageContext)
            }
        })

        await this.openUrl(result, String.format(translate('builtin_url_invalid_format'), result))
    }

    getTypeName(): string {
        return "openUrl"
    }
}

class OpenSelectorBehavior extends BaseBehavior<OpenSelectorButtonBehaviorComponentModel> {
    async innerExecute(
        args: BehaviorArgs,
        jsonDef: OpenSelectorButtonBehaviorComponentModel): Promise<void> {

        let selectPageJsonDef = jsonDef.selectPage

        let routeName = SelectScreenName;

        RootNavigation.navigate(routeName, {selectedData: null, jsonDef: selectPageJsonDef, dataContext: args.dataContext})

        NavigationProcessManager.addTrack(routeName)
            .then(result => {
                if (!selectPageJsonDef.isMultiSelect) {
                    result = result ? [result] : [] /* Always wrap result in a data array in case of multiple */
                }

                Expressions.runFunctionExpression({
                    functionExpression: jsonDef.events.onDataChosen,
                    dataContext: { ...args.dataContext, items: result
                }});
            })
    }

    getTypeName(): string {
        return "openSelector"
    }
}
