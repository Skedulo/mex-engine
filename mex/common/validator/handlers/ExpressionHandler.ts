import Expressions from "../../expression/Expressions";
import {ValidationArgs, ValidationHandler} from "./ValidationHandler";
import {ExpressionValidatorModel} from "@skedulo/mex-types";

export class ExpressionHandler extends ValidationHandler {

    validate(args: ValidationArgs) : [boolean, string|undefined] {

        let { jsonDef, dataContext } = args;

        let { expression, errorMessage } = jsonDef as ExpressionValidatorModel;

        let validationResult = Expressions.getValueExpression({expressionStr: expression, dataContext})

        if (!validationResult) {
            // validation incorrect, get the error message
            return [false, Expressions.getValueFromDollarSignExpression({expressionStr: errorMessage, dataContext}) as string]
        }

        return [true, undefined];
    }

    runThroughExpression(args: ValidationArgs) {
        let { jsonDef, dataContext } = args;

        let { expression, errorMessage } = jsonDef as ExpressionValidatorModel;

        Expressions.getValueExpression({expressionStr: expression, dataContext})
        Expressions.getValueFromLocalizedKey({expressionStr: errorMessage, dataContext})
    }

    getTypeName() {
        return "expression"
    }
}
