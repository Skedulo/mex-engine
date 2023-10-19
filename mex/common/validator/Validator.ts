import { ExpressionHandler } from "./handlers/ExpressionHandler";
import lodash from "lodash";
import {CustomFunctionValidationHandler} from "./handlers/CustomFunctionValidationHandler";
import {ValidationArgs, ValidationHandler} from "./handlers/ValidationHandler";
import {BaseValidatorModel} from "@skedulo/mex-types";

class Validator {
    handlers: ValidationHandler[] = [
        new ExpressionHandler,
        new CustomFunctionValidationHandler
    ]

    async validate(args: ValidationArgs):Promise<[boolean, string|undefined]> {
        let { jsonDef, dataContext } = args;

        if (!jsonDef) return Promise.resolve([false, undefined]);

        if (Array.isArray(jsonDef)) {

            let result: [boolean, string|undefined]|undefined = undefined
            let promises: Promise<[boolean, string|undefined]>[] = []

            lodash.forEach(jsonDef, (eachJsonDef:any) => {

                let handler = this.handlers.find(p => p.getTypeName() === eachJsonDef.type)

                if (!handler)
                    return true

                let eachValidationResultTask = handler.validate({jsonDef: eachJsonDef, dataContext});

                if (eachValidationResultTask instanceof Promise) {
                    promises.push(eachValidationResultTask)

                    eachValidationResultTask.then((eachValidationResult) => {
                        if (!eachValidationResult[0] && result === undefined) {
                            result = [eachValidationResult[0], eachValidationResult[1]];
                        }
                    })
                } else {
                    let eachValidationResult = eachValidationResultTask;

                    if (!eachValidationResult[0] && result === undefined) {
                        result = [eachValidationResult[0], eachValidationResult[1]];
                        return false;
                    }
                }

                return true;
            })

            return Promise.all(promises).then(_ => {
                if (result === undefined) {
                    return [true, undefined];
                }

                return result as [boolean, string|undefined]
            })

        } else {
            // Not an array, definitely lone validator
            let handler = this.handlers.find(p => p.getTypeName() === (jsonDef as BaseValidatorModel).type)

            if (!handler)
                return [true, undefined]

            // There is only 1 validation
            let resultTask = handler.validate(args)

            if (resultTask instanceof Promise) {
                return resultTask
            }else{
                return Promise.resolve(resultTask)
            }
        }
    }

    runThroughExpression(args: ValidationArgs): void {
        let { jsonDef, dataContext } = args;

        if (!jsonDef) return;

        if (Array.isArray(jsonDef)) {
            lodash.forEach(jsonDef, (eachJsonDef) => {
                let handler = this.handlers.find(p => p.getTypeName() === eachJsonDef.type)

                if (!handler)
                    return true

                handler.runThroughExpression({jsonDef: eachJsonDef, dataContext});
                return true;
            })

        } else {
            let handler = this.handlers.find(p => p.getTypeName() === (jsonDef as BaseValidatorModel).type)

            if (!handler)
                return

            // There is only 1 validation
            handler.runThroughExpression(args)
        }
    }
}

export default new Validator() as Validator

