import Expressions from "../mex/common/expression/Expressions";
import LocalizationManager from "../mex/assets/LocalizationManager";
import {DevelopmentModeConfigEnum} from "../mex/GlobalConfiguration";
import {SimpleProductData1} from "../__tests_data__/DataContextData";
import {ValueExpressionLogic} from "@skedulo/mex-types";

jest.mock("../mex/GlobalConfiguration", () => {
    const originalModule = jest.requireActual("../mex/GlobalConfiguration");

    originalModule.default.canUseDevelopmentConfig = (_: DevelopmentModeConfigEnum) => true

    return originalModule
})

beforeEach(() => {
    jest.resetModules()
        .resetAllMocks()
})

describe('getValueFromLocalizationExpression', function () {

    it('should return localized string basic', async function () {
        await LocalizationManager.initializeLocalization()

        let actualResult = Expressions.getValueFromLocalizedKey({expressionStr: 'hello', dataContext: {}})

        expect(actualResult).toBe("Hello World!")
    });

    it('should return localized string with dollar sign', async function () {

        jest.doMock("../mex/assets/LocalizationManager", () => {
            let mock:any;

            mock = jest.requireActual("../mex/assets/LocalizationManager")

            mock.default.loadFromLocalResources = () => {
                return [
                    ["en"],
                    {
                        "en": {
                            "stringWithDollarSign": "This is a variable value: ${pageData.text}"
                        }
                    }
                ]
            }

            return mock
        })

        const LocalizationManager = require("../mex/assets/LocalizationManager")

        await LocalizationManager.default.initializeLocalization();

        const Expressions = require("../mex/common/expression/Expressions")

        let actualResult = Expressions.default.getValueFromLocalizedKey({expressionStr: 'stringWithDollarSign', dataContext: {
            pageData: {
                UID: "1",
                __typename: "Object",
                text: "A Value"
            }
        }})

        expect(actualResult).toBe("This is a variable value: A Value")
    });

    it('given a localized string with dateFormat - expect return date', async function () {

        jest
        .doMock("../mex/common/Converters", () => {
            let mock = jest.requireActual("../mex/common/Converters")

            mock.default.date.dateFormat = (): Promise<string> => {
                return Promise.resolve("A random date")
            }

            return mock
        })
        .doMock("../mex/assets/LocalizationManager", () => {
            let mock:any;

            mock = jest.requireActual("../mex/assets/LocalizationManager")

            mock.default.loadFromLocalResources = () => {
                return [
                    ["en"],
                    {
                        "en": {
                            "stringWithDollarSign": "Qty: ${pageData.qty} - Date: ${dateFormat(pageData.createdDate)}"
                        }
                    }
                ]
            }

            return mock
        })

        require("../mex/common/Converters")

        const LocalizationManager = require("../mex/assets/LocalizationManager")

        await LocalizationManager.default.initializeLocalization();

        const Expressions = require("../mex/common/expression/Expressions")

        let actualResult = await Expressions.default.getValueFromLocalizedKey({expressionStr: 'stringWithDollarSign', dataContext: SimpleProductData1()})

        expect(actualResult).toBe("Qty: 2 - Date: A random date")
    });

});

describe('getDataValueExpression', function () {

    it('given a correct data context - expect return normal value', async function () {
        let dataContext = SimpleProductData1()

        let actualResult = Expressions.getRawDataValueExpression({expressionStr: 'pageData.title', dataContext: dataContext})

        expect(actualResult).toBe("My Product")
    });

    it('given no data context - expect return undefined value', async function () {
        let actualResult = Expressions.getRawDataValueExpression({expressionStr: 'pageData.title', dataContext: {}})

        expect(actualResult).toBeUndefined()
    });

});

describe('fetchDataValueExpression', function () {

    it('given a condition that is true - expect return true', async function () {
        let actualResult = Expressions.getValueExpression({expressionStr: 'pageData.qty > 0 && pageData.qty < 10', dataContext: SimpleProductData1()})

        expect(actualResult).toBe(true)
    });

    it('given a condition that is false - expect return false', async function () {
        let actualResult = Expressions.getValueExpression({expressionStr: 'pageData.qty > 5', dataContext: SimpleProductData1()})

        expect(actualResult).toBe(false)
    });

    it('given a condition that equal to a string constant - expect return true', async function () {
        let actualResult = Expressions.getValueExpression({expressionStr: "pageData.title == 'My Product'", dataContext: SimpleProductData1()})

        expect(actualResult).toBe(true)
    });

    it('given a condition that use a method equals to true - expect return true', async function () {
        let actualResult = Expressions.getValueExpression({expressionStr: "converters.data.isTempUID(pageData) == true", dataContext: SimpleProductData1()})

        expect(actualResult).toBe(true)
    });

    it('given a condition that use a method equals to false - expect return false', async function () {
        let actualResult = Expressions.getValueExpression({expressionStr: "converters.data.isTempUID(pageData) == false", dataContext: SimpleProductData1()})

        expect(actualResult).toBe(false)
    });

});

describe('getValueFromDollarSignExpression', function () {

    it('given a correct data context expect return normal value', async function () {
        let dataContext = SimpleProductData1()

        let actualResult = Expressions.getValueFromDollarSignExpression({expressionStr: '${pageData.title} and Product', dataContext: dataContext})

        expect(actualResult).toBe("My Product and Product")
    });

    it('given no data context expect return undefined value', async function () {
        let actualResult = Expressions.getValueFromDollarSignExpression({expressionStr: '${pageData.title} and Product', dataContext: {}})

        expect(actualResult).toBe("Not set")
    });


});


describe('setValue', function () {

    it('Set entire array to expression path its an array', async function () {
        let dataContext = SimpleProductData1()

        let expressionArgs = {expressionStr: 'pageData.users', dataContext: dataContext}

        Expressions.setDataValueExpression(expressionArgs, [{ "UID": "user-1"}])

        let usersValue = Expressions.getValueExpression(expressionArgs)

        expect(usersValue.length).toBe(1)
        expect(usersValue[0].UID).toBe("user-1")
    });

    it('Set an objects to an existing objects should flat out the properties, not just replace the entire object', async function () {
        let dataContext = SimpleProductData1()

        let expressionArgs = {expressionStr: 'pageData.userInfo', dataContext: dataContext}

        Expressions.setDataValueExpression(expressionArgs, { "UID": "user-1"})

        let usersValue = Expressions.getValueExpression(expressionArgs)

        expect(usersValue.Name).toBe("Huy Vu")
        expect(usersValue.UID).toBe("user-1")
    });

})


describe('conLocale', function () {

    it('render value when field is valid for constant', async function () {
        jest.doMock("../mex/assets/LocalizationManager", () => {
            let mock:any;

            mock = jest.requireActual("../mex/assets/LocalizationManager")

            mock.default.loadFromLocalResources = () => {
                return [
                    ["en"],
                    {
                        "en": {
                            "stringWithDollarSign": "This is a variable value: ${conLocale(pageData.text, 'Yes', 'No')}",
                            "Yes": "Yes!!!"
                        }
                    }
                ]
            }

            return mock
        })

        const LocalizationManager = require("../mex/assets/LocalizationManager")

        await LocalizationManager.default.initializeLocalization();

        const Expressions = require("../mex/common/expression/Expressions")

        let actualResult = Expressions.default.getValueFromLocalizedKey({expressionStr: 'stringWithDollarSign', dataContext: {
                pageData: {
                    UID: "1",
                    __typename: "Object",
                    text: "A Value"
                }
            }})

        expect(actualResult).toBe("This is a variable value: Yes!!!")
    });

    it('render value when field is valid for variable', async function () {
        jest.doMock("../mex/assets/LocalizationManager", () => {
            let mock:any;

            mock = jest.requireActual("../mex/assets/LocalizationManager")

            mock.default.loadFromLocalResources = () => {
                return [
                    ["en"],
                    {
                        "en": {
                            "stringWithDollarSign": "This is a variable value: ${conLocale(pageData.text, 'Yes', 'No')}",
                            "Yes": "Yes!!! ${pageData.name}"
                        }
                    }
                ]
            }

            return mock
        })

        const LocalizationManager = require("../mex/assets/LocalizationManager")

        await LocalizationManager.default.initializeLocalization();

        const Expressions = require("../mex/common/expression/Expressions")

        let actualResult = Expressions.default.getValueFromLocalizedKey({expressionStr: 'stringWithDollarSign', dataContext: {
                pageData: {
                    UID: "1",
                    __typename: "Object",
                    text: "A Value",
                    name: "John Wick",
                }
            }})

        expect(actualResult).toBe("This is a variable value: Yes!!! John Wick")
    });

    it('render value when field is invalid for constant', async function () {
        jest.doMock("../mex/assets/LocalizationManager", () => {
            let mock:any;

            mock = jest.requireActual("../mex/assets/LocalizationManager")

            mock.default.loadFromLocalResources = () => {
                return [
                    ["en"],
                    {
                        "en": {
                            "stringWithDollarSign": "This is a variable value: ${conLocale(pageData.text, 'Yes', 'No')}",
                            "No": "No!!!"
                        }
                    }
                ]
            }

            return mock
        })

        const LocalizationManager = require("../mex/assets/LocalizationManager")

        await LocalizationManager.default.initializeLocalization();

        const Expressions = require("../mex/common/expression/Expressions")

        let actualResult = Expressions.default.getValueFromLocalizedKey({expressionStr: 'stringWithDollarSign', dataContext: {
                pageData: {
                    UID: "1",
                    __typename: "Object",
                    text: undefined
                }
            }})

        expect(actualResult).toBe("This is a variable value: No!!!")
    });

});


describe('getValueFromValueExpression', function () {

    let branchingLogic: ValueExpressionLogic[] = [
        {
            value: "'success'",
            condition: "pageData.status == 'Approved'"
        },
        {
            value: "default"
        }
    ]

    it("Get success value from branching", function() {
        let dataContext = SimpleProductData1()

        dataContext.pageData.status = 'Approved'

        let actualResult = Expressions.getDataFromValueExpression({valueDef: branchingLogic, dataContext: dataContext})

        expect(actualResult).toBe("success")
    })

    it("Get success value from normal string", function() {

        let actualResult = Expressions.getDataFromValueExpression({valueDef: 'success', dataContext: {}})

        expect(actualResult).toBe("success")
    })

    it("Get default value from branching", function() {
        let dataContext = SimpleProductData1()

        dataContext.pageData.status = 'Unidentified'

        let actualResult = Expressions.getDataFromValueExpression({valueDef: branchingLogic, dataContext: dataContext})

        expect(actualResult).toBe("default")
    })
});
