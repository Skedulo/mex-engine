import {String} from "../../mex/common/String";

beforeEach(() => {
    jest.resetModules()
        .resetAllMocks()
})

describe('FormatText', () => {

    it('Format text', () => {

        let result = String.format("{0} and {1} and {2}", "One", "Two", "Three")

        expect("One and Two and Three").toBe(result)

    })
})
