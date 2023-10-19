import DataUtils from "../../mex/common/utils/DataUtils";

describe('hasAnyChildWithInvalidData', () => {

    it('given the object has a child property with invalid state - expect return true', () => {

        let data:any = {
            UID: "xxx",
            __typename: "Object",
            child: {
                UID: "xxx",
                __typename: "Object",
                __invalid: true
            }}

        const actual = DataUtils.hasAnyChildWithInvalidData(data)

        expect(true).toBe(actual)
    })


    it('given the object has invalid state - expect return true', () => {

        let data:any = {
            UID: "xxx",
            __typename: "Object",
            children: [
                {
                UID: "xxx",
                __typename: "Object",
                __invalid: true
                },
                {
                    UID: "yyy",
                    __typename: "Object",
                }
            ],
        }

        const actual = DataUtils.hasAnyChildWithInvalidData(data)

        expect(true).toBe(actual)

    })

    it('given the object has no child property and no child array with invalid state - expect return false', () => {

        let data:any = {
            UID: "xxx",
            __typename: "Object",
            child: {
                UID: "xxx",
                __typename: "Object",
            },
            children: [
                {
                    UID: "xxx",
                    __typename: "Object",
                },
                {
                    UID: "yyy",
                    __typename: "Object",
                }
            ],
        }

        const actual = DataUtils.hasAnyChildWithInvalidData(data)

        expect(false).toBe(actual)

    })
})
