import React from 'react';
import {render} from '@testing-library/react-native';
import Divider from "../../components/Divider";
import ThemeManager from "../../mex/colors/ThemeManager";

describe('Divider component tests', function () {

    it('Divider component basic renderer', async function () {
        const tree = render(<Divider />)

        expect(tree.toJSON()).toMatchSnapshot()
    });

    it('Divider component with different color renderer', async function () {
        let colors = ThemeManager.getColorSet()

        const tree = render(<Divider color={colors.navy600} />)

        expect(tree.toJSON()).toMatchSnapshot()
    });
});
