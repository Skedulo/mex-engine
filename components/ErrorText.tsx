import * as React from "react";
import {Text} from "react-native";
import {FC, MutableRefObject, useContext, useEffect, useImperativeHandle, useRef, useState} from "react";
import Validator from "../mex/common/validator/Validator";
import StylesManager from "../mex/StylesManager";
import {observer} from "mobx-react";
import MexAsyncText from "./MexAsyncText";
import Expressions from "../mex/common/expression/Expressions";
import {
    FlatContentViewContext,
    FlatContentViewContextObj
} from "./CoreUIRenderers/FlatContentViewRenderer";
import {ValidatorDefinitionModel} from "@skedulo/mex-types";

type ErrorTextProps = {
    dataContext: any
    jsonDef: ValidatorDefinitionModel|undefined
    validatedRef: MutableRefObject<boolean>
    onHasErrorChanged?: (hasError: boolean) => void
}

type Props = {
    dataContext: any
    jsonDef: ValidatorDefinitionModel|undefined
    onHasErrorChanged?: (hasError: boolean) => void
}

export type ErrorTextRefFunction = {
    validate: () => Promise<any>
}


const ErrorText = observer<FC<ErrorTextProps>>((props: ErrorTextProps) => {

    let {dataContext, jsonDef, validatedRef, onHasErrorChanged} = props;

    let flatContentViewContext = useContext<FlatContentViewContextObj|undefined>(FlatContentViewContext)

    const _isMounted = useRef(true)

    useEffect(() => {
        _isMounted.current = true

        return () => {
            _isMounted.current = false;
        }
    }, []);

    let skipNextValidation = useRef(false)
    let styleConst = StylesManager.getStyleConst()

    Validator.runThroughExpression({dataContext: dataContext, jsonDef: jsonDef});

    let [errorMessage, setErrorMessage] = useState<string|null>(null)

    let innerValidate = function(): Promise<any> {
        if (skipNextValidation.current) {
            skipNextValidation.current = false
            return Promise.resolve([true, undefined]);
        }

        if (validatedRef.current) {
            // First time render, don't need to run further validation
            validatedRef.current = false
            return Promise.resolve([true, undefined]);

        } else {
            return Validator.validate({dataContext: dataContext, jsonDef: jsonDef}).then(validationResult => {
                if (!_isMounted.current) {
                    return
                }

                // It's not the first time, so showing error message if any
                if (validationResult[1] === errorMessage) {
                    // Don't do anything if the error message is the same
                    return validationResult;
                }

                let newErrorMessage:string|null = null;

                if (!validationResult[0]) {
                    newErrorMessage = validationResult[1] ?? null
                }

                if (newErrorMessage != errorMessage) {
                    // Set state will trigger a re-render, and we don't want the next re-render will trigger a validation again
                    skipNextValidation.current = true;

                    setErrorMessage(newErrorMessage)
                    onHasErrorChanged?.(newErrorMessage != null)
                }

                return validationResult
            });
        }
    }

    // Validate first time to make observable observe value
    innerValidate();

    let ref = useRef<ErrorTextRefFunction>()

    let refFunctions: ErrorTextRefFunction = {
        validate: function() {
            return innerValidate()
        }
    }

    useImperativeHandle(ref, () => refFunctions)

    useEffect(() => {

        flatContentViewContext?.validators.push(ref)

        return () => {
            let index = flatContentViewContext?.validators.indexOf(ref)

            if (index !== -1) {
                flatContentViewContext?.validators.slice(index, 1)
            }
        }
    })

    let component

    if (errorMessage) {

        const getErrorMessage = async (): Promise<string> => {

            let title = Expressions.getValueFromLocalizedKey({expressionStr: errorMessage as string, dataContext: dataContext})

            if (title instanceof Promise) {
                return await title
            }

            return title;
        }

        component = (
            <MexAsyncText promiseFn={getErrorMessage}>
                {(translatedText) => <Text style={[StylesManager.getStyles().errorText, { marginTop: styleConst.componentVerticalPadding}]}>
                    {translatedText}
                </Text>}
            </MexAsyncText>
        )
    } else {
        component = null
    }

    return component
})

const ErrorTextWithRef = React.forwardRef<boolean, Props>((props, ref) => {

    let mutableRefObject = (ref as MutableRefObject<boolean>)!

    return <ErrorText
        onHasErrorChanged={props.onHasErrorChanged}
        validatedRef={mutableRefObject}
        dataContext={props.dataContext}
        jsonDef={props.jsonDef} />
})

export default ErrorTextWithRef
