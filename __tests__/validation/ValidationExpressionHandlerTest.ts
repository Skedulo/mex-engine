import {ExpressionHandler} from "../../mex/common/validator/handlers/ExpressionHandler";
import {SimpleProductData1} from "../../__tests_data__/DataContextData";
import {ExpressionValidatorModel} from "@skedulo/mex-types";

describe('getDataValueExpression', function () {

    it('given a positive dataset - expect validation pass', async function () {
        let expressionHandler = new ExpressionHandler()

        let jsonDef: ExpressionValidatorModel = {
            expression: "pageData.qty > 0 && pageData.qty < 10",
            errorMessage: "errorMessage",
            type: "expression"
        }

        let actualResult = expressionHandler.validate({
            dataContext: SimpleProductData1(),
            jsonDef: jsonDef
        })

        expect(actualResult[0]).toBe(true)
        expect(actualResult[1]).toBeUndefined()
    });

    it('given a negative data set - expect validation fail', async function () {
        let expressionHandler = new ExpressionHandler()

        let jsonDef: ExpressionValidatorModel = {
            expression: "pageData.qty > 5 && pageData.qty < 10",
            errorMessage: "errorMessage",
            type: "expression"
        }

        let actualResult = expressionHandler.validate({
            dataContext: SimpleProductData1(),
            jsonDef: jsonDef
        })

        expect(actualResult[0]).toBe(false)
        expect(actualResult[1]).toBe("errorMessage")
    });

});
