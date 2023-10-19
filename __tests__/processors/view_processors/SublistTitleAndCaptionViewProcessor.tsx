import React from 'react';
import {act, render} from "@testing-library/react-native";
import {DevelopmentModeConfigEnum} from "../../../mex/GlobalConfiguration";
import {
    SublistPageViewArgs
} from "../../../mex/common/processors/flat_page_views/sublist/AbstractSublistViewProcessor";
import {SimpleProductData1} from "../../../__tests_data__/DataContextData";
import {
    SublistTitleAndCaptionViewComponentModel
} from "@skedulo/mex-types";
import {NavigationContext} from "../../../mex/common/NavigationProcessManager";
import StylesManager from "../../../mex/StylesManager";
import SublistTitleAndCaptionViewProcessor
    from "../../../mex/common/processors/flat_page_views/sublist/SublistTitleAndCaptionViewProcessor";
import Localization from "../../../mex/assets/LocalizationManager";

jest.mock("../../../mex/GlobalConfiguration", () => {
    const originalModule = jest.requireActual("../../../mex/GlobalConfiguration");

    originalModule.default.canUseDevelopmentConfig = (_: DevelopmentModeConfigEnum) => true

    return originalModule
})

jest.mock("../../../mex/assets/LocalizationManager", () => {
    let mock:any;

    mock = jest.requireActual("../../../mex/assets/LocalizationManager")

    mock.default.loadFromLocalResources = () => {
        return [
            ["en"],
            {
                "en": {
                    "title": "Title",
                    "caption": "Caption"
                }
            }
        ]
    }

    return mock
})

beforeEach(() => {
    jest.resetModules()
        .resetAllMocks()
})



describe('Sublist title and caption view processor tests', function () {


    it('SublistTitleAndCaptionViewProcessor basic render', async function () {

        jest.setTimeout(10_000)

        await Localization.initializeLocalization();
        StylesManager.initializeStyles()

        let viewProcessor = new SublistTitleAndCaptionViewProcessor();

        let argsModel: SublistTitleAndCaptionViewComponentModel = {
            title: "title",
            caption: "caption",
            type: "subListTitleAndCaption"
        }

        let args:SublistPageViewArgs<SublistTitleAndCaptionViewComponentModel> = {
            dataContext: SimpleProductData1(),
            jsonDef: argsModel,
            navigationContext: new NavigationContext()
        };

        let Comp = viewProcessor.generateComponent()

        let renderer = render(<Comp args={args} />)

        expect(renderer.toJSON()).toMatchSnapshot()

        await act(async () => {
            await new Promise((r) => setTimeout(r, 20));
        });

        expect(renderer.toJSON()).toMatchSnapshot()
    });

});
