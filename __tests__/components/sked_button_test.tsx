import React from 'react';
import SkedButton from "../../components/SkedButton";
import {act, fireEvent, render} from "@testing-library/react-native";
import StylesManager from "../../mex/StylesManager";

describe('SkedButton Component Tests', function () {

    it('SkedButton basic renderer', async function () {
        StylesManager.initializeStyles()

        const getText = async (): Promise<string> => {
            return Promise.resolve("Test button")
        }

        const tree = render(<SkedButton textPromiseFn={getText} />)

        await act(async () => {
            await new Promise((r) => setTimeout(r, 10));
        });

        expect(tree.toJSON()).toMatchSnapshot()

        expect(tree.getByText("Test button")).toBeTruthy()

        fireEvent(tree.getByTestId("sked-button"), "onPressIn")

        expect(tree.toJSON()).toMatchSnapshot()

        fireEvent(tree.getByTestId("sked-button"), "onPressOut")

        expect(tree.toJSON()).toMatchSnapshot()
    });
});
