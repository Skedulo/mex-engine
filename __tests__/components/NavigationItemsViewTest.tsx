import React from "react";
import StylesManager from "../../mex/StylesManager";

import {
    render,
} from "@testing-library/react-native";
import {NavigationItemsView} from "../../components/NavigationItemsView";

describe('NavigationItemsView component tests', function () {

    it('NavigationItemsView basic render', async function () {

        StylesManager.initializeStyles()

        let renderer = render(<NavigationItemsView items={[
            {text: "Test", onClicked: () => {}},
            {iconSource: () => require("../../img/Search_Placeholder.png"), onClicked: () => {}
            }]} />)

        expect(renderer.toJSON()).toMatchSnapshot()
    });

    it('NavigationItemsView empty render', async function () {

        StylesManager.initializeStyles()

        let renderer = render(<NavigationItemsView items={[]} />)

        expect(renderer.toJSON()).toMatchSnapshot()
    });

});
