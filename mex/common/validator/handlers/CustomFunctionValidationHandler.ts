import Expressions from "../../expression/Expressions";
import {ValidationArgs, ValidationHandler} from "./ValidationHandler";
import converters from "../../Converters";
import AssetsManager from "../../../assets/AssetsManager";
import InternalUtils from "../../InternalUtils";
import {CustomFunctionValidatorModel} from "@skedulo/mex-types";

export class CustomFunctionValidationHandler extends ValidationHandler {

    validate(args:ValidationArgs):[boolean, string|undefined] {

        let { jsonDef, dataContext } = args;
        let { functionName } = jsonDef as CustomFunctionValidatorModel
        let extra = { converters: converters, expressions: Expressions, ...InternalUtils.misc.getExtrasForCustomFunctionCall() }
        let context = { dataContext: dataContext, extra: extra }

        let javascriptFunc = AssetsManager.getCustomFunction()

        if (!javascriptFunc || javascriptFunc === "") {
            // Custom function does not exists, proceed
            return [true, undefined]
        }

        javascriptFunc += "\n" + `exportFns.${functionName}(dataContext, extra)`

        let errorMessage = this.evalInContext(javascriptFunc, context)

        if (errorMessage) {
            return [false, errorMessage]
        } else {
            return [true, undefined]
        }
    }

    // @ts-ignore
    evalInContext(js:string, context:any) {
        return eval('with(context) { ' + js + ' }');
    }

    runThroughExpression(_:ValidationArgs) {
    }

    getTypeName() {
        return "customFunction"
    }
}
