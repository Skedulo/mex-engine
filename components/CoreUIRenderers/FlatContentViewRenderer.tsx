import React, {MutableRefObject, useEffect, useRef} from "react";
import {ErrorTextRefFunction} from "../ErrorText";
import {StyleSheet, Text, View} from "react-native";
import ThemeManager from "../../mex/colors/ThemeManager";
import MexAsyncText from "../MexAsyncText";
import Expressions from "../../mex/common/expression/Expressions";
import FlatPageViewProcessorsManager from "../../mex/common/processors/flat_page_views/FlatPageViewProcessorsManager";
import StylesManager from "../../mex/StylesManager";
import {NavigationContext} from "../../mex/common/NavigationProcessManager";
import ErrorTextWithRef from "../ErrorText";
import {
    BaseComponentModel,
    BaseFlatPageViewComponentModel,
    DataExpressionType,
    ValidatorDefinitionModel,
    FlatPageHeaderModel
} from "@skedulo/mex-types";
import TagsView from "../TagsView";
import Divider from "../Divider";

export type Props = {
    items: BaseFlatPageViewComponentModel[]
    navigationContext: NavigationContext
    dataContext: any
    formValidator?: ValidatorDefinitionModel|undefined,
    readonly?: DataExpressionType|boolean,
    header?: FlatPageHeaderModel
}

export class FlatContentViewContextObj {

    private _readonly: boolean = false
    private _readonlyListenersMap: Map<any, (readonly: boolean) => void> = new Map()

    constructor() {}

    validators: MutableRefObject<ErrorTextRefFunction | undefined>[] = []

    public get readonly(): boolean {
        return this._readonly;
    }

    public set readonly(value: boolean) {
        this._readonly = value;
    }

    addReadonlyListener(ref: any, listener: (readonly: boolean) => void): void {
        this._readonlyListenersMap.set(ref, listener);
    }

    removeReadonlyListener(ref: any): void {
        this._readonlyListenersMap.delete(ref)
    }
}

export interface FlatPageContentViewRefFunctions {
    validate?: (() => Promise<boolean>)
}

class FlatPageContentViewRefFunctionsImpl implements FlatPageContentViewRefFunctions {

}

export const FlatContentViewContext = React.createContext<FlatContentViewContextObj | undefined>(undefined)

export const FlatContentViewRenderer = React.forwardRef<FlatPageContentViewRefFunctions, Props>((props, ref) => {

    let {
        formValidator,
        dataContext,
        items,
        navigationContext,
        readonly,
        header
    } = props!;

    const { title, description, tags} = header ?? {}

    let styleConst = StylesManager.getStyleConst()
    let styles = StylesManager.getStyles()

    let flatPageContentViewContextObjRef = useRef<FlatContentViewContextObj>(new FlatContentViewContextObj())
    let validatedRef = useRef<boolean>(true)

    ref = ref as MutableRefObject<FlatPageContentViewRefFunctions | null>

    if (ref && !ref.current) {
        ref.current = new FlatPageContentViewRefFunctionsImpl()
        ref.current.validate = function(): Promise<boolean> {
            if (!flatPageContentViewContextObjRef.current) {
                return Promise.resolve(false);
            }

            let validationResult = true;
            let promises: Promise<any>[] = []

            flatPageContentViewContextObjRef.current.validators.forEach((validator) => {
                if (!validator.current)
                    return

                let promise = validator.current.validate().then((validatorResult: any) => {
                    if (validatorResult && !validatorResult[0]) {
                        validationResult = false;
                    }
                })

                promises.push(promise)
            })

            return Promise.all(promises).then(_ => validationResult)
        }
    }

    if (readonly) {
        if (typeof readonly === 'boolean') {
            flatPageContentViewContextObjRef.current.readonly = readonly as boolean
        } else {
            flatPageContentViewContextObjRef.current.readonly = Expressions.getValueExpression({ expressionStr: readonly, dataContext: dataContext })
        }
    }

    useEffect(() => {
        return () => {
            flatPageContentViewContextObjRef.current.validators = []
        }
    }, [flatPageContentViewContextObjRef.current])

    let generateValidatorIfPossible = (): JSX.Element | null => {

        if (!formValidator) {
            return (<></>)
        }

        return (
            <View style={{paddingHorizontal: styleConst.defaultHorizontalPadding}}>
                <ErrorTextWithRef
                    ref={validatedRef}
                    jsonDef={formValidator}
                    dataContext={dataContext}/>
            </View>)
    }

    const getHeaderTitle = async (): Promise<string> => {
        if (!title) {
            return ""
        }

        const result = Expressions.getValueFromLocalizedKey({expressionStr: title, dataContext: dataContext})

        if (result instanceof Promise) {
            return await result
        }

        return result;
    }

    const getHeaderDescription = async (): Promise<string> => {
        if (!description) {
            return ""
        }

        const result = Expressions.getValueFromLocalizedKey({expressionStr: description, dataContext: dataContext})

        if (result instanceof Promise) {
            return await result
        }

        return result;
    }

    return (
        <FlatContentViewContext.Provider value={flatPageContentViewContextObjRef.current}>
            <View>
                <View style={componentStyles.headerContainer}>
                    {!!title && (
                        <MexAsyncText promiseFn={getHeaderTitle}>
                            {(text) => (
                                <Text style={[styles.textHeadingBold, componentStyles.textTitle]}>
                                    {text}
                                </Text>)}
                        </MexAsyncText>
                    )}

                    {!!description && (
                        <MexAsyncText promiseFn={getHeaderDescription}>
                            {(text) => (
                                <Text style={[styles.textRegular, { marginTop: title ? styleConst.smallVerticalPadding : 0 }]}>
                                    {text}
                                </Text>)
                            }
                        </MexAsyncText>)
                    }

                    { tags && <TagsView dataContext={dataContext} uiDef={tags} /> }

                    {(!!title || !!description || tags)
                        && <Divider style={{ marginVertical: 16 }} color={ThemeManager.getColorSet().navy100}/>
                    }
                </View>

                {generateValidatorIfPossible()}

                {items.map((childItemDef: BaseComponentModel, index: number) => {
                    let processor = FlatPageViewProcessorsManager.findProcessor(childItemDef.type)

                    if (!processor) {
                        return (
                            <View
                                key={index}
                                style={{marginTop: styleConst.componentVerticalPadding}}>
                                <Text>Can't find corresponding component with type {childItemDef.type} in
                                    FlatPageViewProcessorsManager</Text>
                            </View>)
                    } else {
                        let FlatPageComp = processor.generateComponent();
                        let horizontalMargin = processor.isFullWidthLayout() ? 0 : styleConst.defaultHorizontalPadding
                        let marginTop = (processor.hasTopMargin() && index !== 0) ? styleConst.betweenComponentVerticalSpacing : 0

                        return (
                            <View
                                style={{ marginHorizontal: horizontalMargin, marginTop: marginTop }}
                                key={index}>
                                <FlatPageComp
                                    args={{
                                        jsonDef: childItemDef,
                                        dataContext,
                                        navigationContext: navigationContext,
                                        showDivider: index != items.length - 1
                                    }}/>
                            </View>)
                    }
                })}
            </View>
        </FlatContentViewContext.Provider>
    )
})

const componentStyles = StyleSheet.create({
    headerContainer: {
        backgroundColor: ThemeManager.getColorSet().white,
        marginHorizontal: 16
    },
    textTitle: {
        marginRight: 8,
        flex: 1,
    }
})
