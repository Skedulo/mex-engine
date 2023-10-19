import AbstractProcessor from "../AbstractProcessor";
import {StandardComponentArgs, StandardComponentProps} from "../AbstractProcessor";
import Expressions from "../../expression/Expressions";
import {BaseFlatPageViewComponentModel} from "@skedulo/mex-types";

export type FlatPageViewProps<
    TComponentArgs extends FlatPageViewArgs<TComponentDefinitionModel>,
    TComponentDefinitionModel extends BaseFlatPageViewComponentModel>
    = StandardComponentProps<TComponentArgs, TComponentDefinitionModel>

export type FlatPageViewArgs<TComponentDefinitionModel extends BaseFlatPageViewComponentModel> = StandardComponentArgs<TComponentDefinitionModel> & {
}

abstract class AbstractFlatPageViewProcessor<
    TComponentProps extends FlatPageViewProps<TComponentArgs, TComponentDefinitionModel>,
    TComponentArgs extends FlatPageViewArgs<TComponentDefinitionModel>,
    TComponentDefinitionModel extends BaseFlatPageViewComponentModel>
    extends AbstractProcessor<TComponentProps, TComponentArgs, TComponentDefinitionModel> {

    isFullWidthLayout() {
        return false
    }

    hasTopMargin() {
        return true
    }

    /**
     * Check if the component is suitable to show
     * @param args
     */
    checkVisibility(args: TComponentArgs): boolean {
        if (!args.jsonDef.showIfExpression)
            return true /* Return true if no showIf is defined */

        return Expressions.getValueExpression({ expressionStr: args.jsonDef.showIfExpression, dataContext: args.dataContext });
    }

}

export default AbstractFlatPageViewProcessor
