import React from "react";
import MexAsyncText from "../../components/MexAsyncText";
import {Text} from "react-native";
import StylesManager from "../../mex/StylesManager";

import {
    act,
    render,
} from "@testing-library/react-native";

describe('MexAsyncText component tests', function () {

    it('MexAsyncText basic render', async function () {

        StylesManager.initializeStyles()

        let styles = StylesManager.getStyles()

        const getTitle = async function() {
            await new Promise((r) => setTimeout(r, 10));

            return "The return result is title"
        }

        let renderer = render(<MexAsyncText promiseFn={getTitle}>
            {(text) => (
                <Text style={styles.textRegular}>{text}</Text>)}
        </MexAsyncText>)

        await act(async () => {
            await new Promise((r) => setTimeout(r, 20));
        });

        expect(renderer.getByText('The return result is title')).toBeTruthy();
    });

    it('MexAsyncText error render', async function () {

        StylesManager.initializeStyles()

        let styles = StylesManager.getStyles()

        let errorMessage = "Oops, there is an error while rendering"

        const getTitle = async function() {
            throw Error(errorMessage)
        }

        let renderer = render(<MexAsyncText promiseFn={getTitle}>
            {(text) => (
                <Text style={styles.textRegular}>{text}</Text>)}
        </MexAsyncText>)

        await act(async () => {
            await new Promise((r) => setTimeout(r, 10));
        });

        expect(renderer.getByText(errorMessage)).toBeTruthy();
    });

});
