import InternalUtils from "../../mex/common/InternalUtils";
import {SimpleProductData1} from "../../__tests_data__/DataContextData";
import {DevelopmentModeConfigEnum} from "../../mex/GlobalConfiguration";
import {NavigationContext} from "../../mex/common/NavigationProcessManager";

jest.mock("../../mex/GlobalConfiguration", () => {
    const originalModule = jest.requireActual("../../mex/GlobalConfiguration");

    originalModule.default.canUseDevelopmentConfig = (_: DevelopmentModeConfigEnum) => true

    return originalModule
})

beforeEach(() => {
    jest.resetModules()
        .resetAllMocks()
})

describe('getKeyFromStructure', () => {

    it('should able to get key with correct structure', () => {

        let structure: any = {"UID": "xxx", "__typename": "Object"}

        const expected = "Object:xxx"
        const actual = InternalUtils.data.getKeyFromObject(structure)

        expect(actual).toBe(expected)

    })
})

describe('upsertToList', () => {

    it('given normal data - expect upsertToList without problem', () => {

        let newObjectKey = "temp-xxx";

        let dataContext = SimpleProductData1()

        InternalUtils.data.upsertToExpression({
            destinationDataExpression: "formData.Products",
            sourceData: dataContext.pageData,
            destinationDataContext: dataContext,
            compareProperty: null
        })

        expect(dataContext.formData.Products.length).toEqual(3)
        expect(dataContext.formData.Products[2].UID).toEqual(newObjectKey)

        let recentProduct = dataContext.formData.Products[dataContext.formData.Products.length - 1];
        expect(recentProduct.title).toEqual("My Product")
        expect(recentProduct.qty).toEqual(2)

    })

})

describe('createTempObject', () => {

    it('given normal default data definition - expect return correct data', () => {

        let dataContext = {
            metadata: {
                contextObjectId: "temp-object-id",
                packageId: "temp-package"
            }
        }

        let result = InternalUtils.data.createTempObject(
            {
                objectName: "JobProduct",
                data: {
                    JobId: "${metadata.contextObjectId}"
                },
            }, dataContext)

        expect(result.UID.startsWith("temp-")).toBeTruthy()
        expect(result.__typename).toEqual("JobProduct")
        expect(result.JobId).toEqual("temp-object-id")
    })

})

describe('alwaysTranslateTextIntoPromise', () => {

    it('given a normal text - expect to return a promise', async () => {

        jest.doMock("../../mex/assets/LocalizationManager", () => {
            let mock: any;

            mock = jest.requireActual("../../mex/assets/LocalizationManager")

            mock.default.loadFromLocalResources = () => {
                return [
                    ["en"],
                    {
                        "en": {
                            "stringWithDollarSign": "${pageData.title}"
                        }
                    }
                ]
            }

            return mock
        })

        const LocalizationManager = require("../../mex/assets/LocalizationManager")

        await LocalizationManager.default.initializeLocalization();

        const InternalUtils = require("../../mex/common/InternalUtils")

        let dataContext = SimpleProductData1()

        let result = InternalUtils.default.data.alwaysTranslateTextIntoPromise(
            "stringWithDollarSign",
            dataContext
        )

        expect(result).toBeInstanceOf(Promise<string>)

        let strResult = await result

        expect(strResult).toEqual("My Product")
    })

})

describe('dataSourceIsFormLevel', () => {

    it('given a 2 level expression from formData - expect return true', async () => {

        let result = InternalUtils.data.dataSourceIsFormLevel("formData.field1")

        expect(result).toBeTruthy()
    })

    it('given only 1 level expression from formData - expect return true', async () => {

        let result = InternalUtils.data.dataSourceIsFormLevel("formData")

        expect(result).toBeTruthy()
    })

    it('given a 2 level expression from pageData - expect return false', async () => {

        let result = InternalUtils.data.dataSourceIsFormLevel("pageData.field1")

        expect(result).toBeFalsy()
    })

    it('given only 1 level expression from pageData - expect return false', async () => {

        let result = InternalUtils.data.dataSourceIsFormLevel("pageData")

        expect(result).toBeFalsy()
    })

})


describe('markAndLoopParentsAsInvalid', () => {

    it('given one child invalid in an array - expect reverse parent objects as invalid', async () => {

        let innerChild = {
            UID: "InnerXXX",
            __typename: "InnerObject",
            __invalid: true
        }

        let item: any =
            {
                UID: "xxx",
                __typename: "Object",
                innerChildren: [innerChild]
            };

        let formData: any = {
            UID: "xxx",
            __typename: "Object",
            children: [
                item,
                {
                    UID: "yyy",
                    __typename: "Object",
                }
            ],
        }

        let innerChildNavigationContext = new NavigationContext()
        innerChildNavigationContext.sourceExpression = "pageData.innerChildren"
        innerChildNavigationContext.currentDataContext = {
            pageData: innerChild,
            formData: formData,
            sharedData: null,
            metadata: {
                contextObjectId: null,
                packageId: ""
            }
        }

        let childNavigationContext = new NavigationContext()
        childNavigationContext.sourceExpression = "formData.children"
        childNavigationContext.currentDataContext = {
            pageData: item,
            formData: formData,
            sharedData: null,
            metadata: {
                contextObjectId: null,
                packageId: ""
            }
        }

        let rootNavigationContext = new NavigationContext()
        rootNavigationContext.currentDataContext = {
            pageData: null,
            formData: formData,
            sharedData: null,
            metadata: {
                contextObjectId: null,
                packageId: ""
            }
        }

        innerChildNavigationContext.prevPageNavigationContext = childNavigationContext
        childNavigationContext.prevPageNavigationContext = rootNavigationContext

        InternalUtils.data.markAndLoopParentsAsInvalid(innerChildNavigationContext)

        expect(item.__invalid).toBeTruthy()
    })

    it('given one child invalid in a property - expect reverse parent objects as invalid', async () => {

        let innerChild = {
            UID: "InnerXXX",
            __typename: "InnerObject",
            __invalid: true
        }

        let item: any =
            {
                UID: "xxx",
                __typename: "Object",
                innerChild: innerChild
            };

        let formData: any = {
            UID: "xxx",
            __typename: "Object",
            child: item
        }

        let innerChildNavigationContext = new NavigationContext()
        innerChildNavigationContext.sourceExpression = "pageData.innerChild"
        innerChildNavigationContext.currentDataContext = {
            pageData: innerChild,
            formData: formData,
            sharedData: null,
            metadata: {
                contextObjectId: null,
                packageId: ""
            }
        }

        let childNavigationContext = new NavigationContext()
        childNavigationContext.sourceExpression = "formData.child"
        childNavigationContext.currentDataContext = {
            pageData: item,
            formData: formData,
            sharedData: null,
            metadata: {
                contextObjectId: null,
                packageId: ""
            }
        }

        let rootNavigationContext = new NavigationContext()
        rootNavigationContext.currentDataContext = {
            pageData: null,
            formData: formData,
            sharedData: null,
            metadata: {
                contextObjectId: null,
                packageId: ""
            }
        }

        innerChildNavigationContext.prevPageNavigationContext = childNavigationContext
        childNavigationContext.prevPageNavigationContext = rootNavigationContext

        InternalUtils.data.markAndLoopParentsAsInvalid(innerChildNavigationContext)

        expect(item.__invalid).toBeTruthy()
    })

})


describe('getFilterSourceByKeywords', () => {

    it('given normal data - expect getFilterSourceByKeywords without problem', () => {

        let source = [{
            ProductName: "Drill",
            Product: {
                Name: "Drill"
            }
        },{
            Product: {
                Name: "Power Saw"
            },
            ProductName: "Power Saw"
        }];

        const filterSource = InternalUtils.data.getFilterSourceByKeywords(
            source,
            "Drill",
            ["Product.Name"]
        )

        expect(filterSource.length).toEqual(1)

        expect(filterSource[0].ProductName).toEqual('Drill')
    })


    it('[DEPRECATED] given vocab data - expect getFilterSourceByKeywords without problem', () => {

        let source = ["First item", "Second item"];

        const filterSource = InternalUtils.data.getFilterSourceByKeywords(
            source,
            "second",
            undefined
        )

        expect(filterSource.length).toEqual(1)

        expect(filterSource[0]).toEqual('Second item')
    })

    it('given vocab data - expect getFilterSourceByKeywords without problem', () => {

        let source = [{Label: "First item", Value: "First item"}, {Label: "Second item", Value: "Second item Value"}];

        const filterSource = InternalUtils.data.getFilterSourceByKeywords(
            source,
            "second",
            undefined
        )

        expect(filterSource.length).toEqual(1)

        expect(filterSource[0].Label).toEqual('Second item')
        expect(filterSource[0].Value).toEqual('Second item Value')
    })

})

describe("orderBy tests", () => {
    it("given a list with condition to sort - expect return correctly", () => {

        let source = [
            {
                UID: 2,
                CreatedDate: "2022-05-31T01:04:18.000Z",
                Product: {
                    Name: "B",
                }
            },
            {
                UID: 3,
                CreatedDate: "2022-05-31T01:03:18.000Z",
                Product: {
                    Name: "B",
                }
            },
            {
                UID: 4,
                CreatedDate: "2022-05-31T01:06:18.000Z",
                Product: {
                    Name: "B",
                }
            },
            {
                UID: 1,
                CreatedDate: "2022-05-31T01:04:18.000Z",
                Product: {
                    Name: "A",
                }
            },
        ];

        let sortedSrc = InternalUtils.data.orderListByExpression(source, {  expression: ["Product.Name asc", "CreatedDate desc"]})

        expect(sortedSrc[0].UID).toEqual(1)
        expect(sortedSrc[1].UID).toEqual(4)
        expect(sortedSrc[2].UID).toEqual(2)
        expect(sortedSrc[3].UID).toEqual(3)
    })
})
