import * as lodash from 'lodash';
import converters from '../Converters';
import utils from "../Utils";
import {translate} from "../../assets/LocalizationManager";
import evaluate from 'simple-evaluate';
import CustomFunctionExecutor from "../CustomFunctionExecutor";
import {LocalizedKey, ValueExpressionLogic} from "@skedulo/mex-types";
import moment from 'moment';
import InternalUtils from "../InternalUtils";
import {DataValueExpressionArgs, ExpressionArgs, FunctionExpressionArgs} from "@skedulo/mex-engine-proxy";
import RegexManager from "../../assets/RegexManager";

abstract class Expression {
    args : ExpressionArgs;

    protected constructor(args: ExpressionArgs) {
        this.args = args;
    }

    abstract getValue() : any

    /**
     * Telling if the component using expression
     * @return {boolean}
     **/
    abstract isExpressionUsed() : boolean

    protected translateValue(expressionContent: string, dataContext: any) : any {

        if (expressionContent.charAt(0) === "'" && expressionContent.charAt(expressionContent.length - 1) === "'"){
            // it's a constant value
            return expressionContent.substring(1, expressionContent.length - 1)
        } else {
            return this.getValueFromExpressionStr(expressionContent, dataContext);
        }
    }

    protected getValueFromExpressionStr(expressionContent: string, dataContext: any) : any {

        if (expressionContent && expressionContent.indexOf(".") == -1) {
            if (dataContext[expressionContent] === undefined)
                return expressionContent /* Most likely this is a normal constant, we want to reduce the usage of 'something', so when it doesn't violate the prefix of the datacontext, it's fine */
        }

        let value = lodash.get(dataContext, expressionContent);

        if (value !== undefined) {
            return value;
        } else{
            return undefined
        }
    }
}

/**
 * Expression for binding
 * BindingExpression never have "${}" inside, which is much more simple, use for only getting data
 */
export class DataExpression extends Expression {
    constructor(args: ExpressionArgs) {
        super(args);
    }

    override getValue() : any {
        let {expressionStr, dataContext} = this.args;

        return this.getValueFromExpressionStr(expressionStr, dataContext)
    }

    public setValue(value: any)  {
        let {expressionStr, dataContext} = this.args;

        let previousValue = lodash.get(dataContext, expressionStr);

        if (value === undefined) {
            // Not able to identify value, first check if the current existing structure has any value
            if (previousValue) {
                // Detect value, now set empty value no matter what
                lodash.set(dataContext, expressionStr, value)

                return;
            }
        }

        if (typeof previousValue === 'object' && previousValue !== null
            && value !== null && typeof value == 'object'
            && !Array.isArray(value)) {
            value = { ...previousValue, ...value}
        }

        lodash.set(dataContext, expressionStr, value)
    }

    override isExpressionUsed() {
        return this.args.expressionStr != null && this.args.expressionStr !== '';
    }
}

/**
 * Display expression
 * DisplayExpression will combine normal string and variable inside, something like: "Profile name: ${profile.name}"
 */
export class DollarSignExpression extends Expression {

    regex: () => RegExp;

    constructor(args: ExpressionArgs) {
        super(args);
        this.regex = () => /\${([^}]*)}/g;
    }

    getValue(): any {

        let hashMap = new Map() // hash map to store expression string to actual value

        let {expressionStr, dataContext} = this.args;

        let matches = [];
        let match;

        let regex = this.regex()

        while ((match = regex.exec(expressionStr)) != null) {
            matches.push(match)
        }

        if (matches.length === 0) {
            return expressionStr;
        }

        let converterPromises: any[] = []

        // now we have the regex matches, search for the content
        matches.forEach((value, _) => {
            let expressionContent = value[1];
            let expressionStringWithDollarSign = value[0];

            // if we already have the value, don't mind storing it again
            if (hashMap.has(expressionStringWithDollarSign)) {
                return;
            }

            // check if there is a converter
            let expressionFinalValue = new FetchValueExpression({expressionStr: expressionContent, dataContext: dataContext, extras: this.args.extras}).getValue();

            if (expressionFinalValue instanceof Promise) {
                let promise = expressionFinalValue.then(value => {
                    hashMap.set(expressionStringWithDollarSign, value)
                })

                converterPromises.push(promise);
            } else {
                hashMap.set(expressionStringWithDollarSign, expressionFinalValue)
            }
        })

        const combineValueForFinalResult = () => {

            if (hashMap.size === 1) {

                let isUndefined = false
                let objectResult = undefined

                hashMap.forEach((value, _) => {
                    if (expressionStr.startsWith("${") && !(typeof value === 'string')) {
                        // If there is only 1 translation and the expressionStr inside is all we got and it return an object => return value as object
                        objectResult = value
                    }

                    if (typeof value === "undefined" || value === "undefined" || value === "null" || value == null){
                        isUndefined = true
                    }
                })

                if (objectResult || isUndefined) {
                    return objectResult ?? translate('builtin_not_set')
                }
            }

            let finalResult = expressionStr;

            // now we have the hash map with actual value, we combine everything for final result
            hashMap.forEach(function(value, key) {
                finalResult = lodash.replace(finalResult, key, value ?? translate('builtin_not_set'))
            })

            return finalResult;
        }

        if (converterPromises.length > 0) {

            // Return a Promise instead of a direct value
            return Promise.all(converterPromises).then(
                _ => {
                    return combineValueForFinalResult()
                }
            );
        } else {
            return combineValueForFinalResult()
        }
    }

    scanValue(): void {
        let hashMap = new Map() // hash map to store expression string to actual value

        let {expressionStr, dataContext} = this.args;

        let matches = [];
        let match;

        let regex = this.regex()

        while ((match = regex.exec(expressionStr)) != null) {
            matches.push(match)
        }

        if (matches.length === 0) {
            return;
        }

        // now we have the regex matches, search for the content
        matches.forEach((value, _) => {
            let expressionContent = value[1];
            let expressionStringWithDollarSign = value[0];

            // if we already have the value, don't mind storing it again
            if (hashMap.has(expressionStringWithDollarSign)) {
                return;
            }

            // Scan value for each dollar sign
            new FetchValueExpression({expressionStr: expressionContent, dataContext: dataContext, extras: this.args.extras})
                .scanValue();
        })
    }

    override isExpressionUsed() {
        return this.regex().test(this.args.expressionStr)
    }
}

export const FetchValueMemoStorage = new Map();

export class FetchValueExpression extends Expression {
    functionRegex = () => /[A-z0-9\.]+(.+)\((.*)\)/g;
    functionParamsRegex = () => /(.+)\((.*)\)/g;
    variableAndFunctionScopeRegex = () => /[a-zA-Z_][a-zA-Z0-9_\[\]]+\.?([a-zA-Z_][a-zA-Z0-9_\[\]]*[\.]?)*(\((.*)\))?/g;
    constantRegex = () => /'([^'])*'/g

    constructor(args: ExpressionArgs) {
        super(args);
    }

    getValue() : Promise<any>|any {
        let {expressionStr, dataContext} = this.args;

        let avoidVariableMatchRanges: [number, number][] = [];
        let functionMatchRanges: [number, number][] = [];
        let matches = [];
        let match;

        let constantRegex = this.constantRegex()
        let functionRegex = this.functionRegex()

        while ((match = constantRegex.exec(expressionStr)) != null) {
            let matchValue = match[0]
            let startIndex = expressionStr.indexOf(matchValue)
            let endIndex = startIndex + matchValue.length

            avoidVariableMatchRanges.push([startIndex, endIndex])
        }

        while ((match = functionRegex.exec(expressionStr)) != null) {
            let matchValue = match[0]
            let startIndex = expressionStr.indexOf(matchValue)
            let endIndex = startIndex + matchValue.length

            functionMatchRanges.push([startIndex, endIndex])
        }

        let variableScopeRegex = this.variableAndFunctionScopeRegex()

        while ((match = variableScopeRegex.exec(expressionStr)) != null) {
            let matchValue = match[0]

            let keywords = ["true", "false"];

            if (keywords.filter(k => k == matchValue.toLowerCase()).length > 0) {
                continue
            }
            let startIndex = expressionStr.indexOf(matchValue)
            let nextEndIndex = startIndex + matchValue.length

            let anyRangeOverlapped = avoidVariableMatchRanges.filter(range => {
                let x1 = range[0]
                let x2 = range[1]
                let y1 = startIndex
                let y2 = nextEndIndex - 1

                return x1 <= y2 && y1 <= x2
            })

            if (anyRangeOverlapped.length > 0)
                continue

            let functionMatchOverlapped = functionMatchRanges.filter(range => {

                let x1 = range[0]
                let x2 = range[1]
                let y1 = startIndex
                let y2 = nextEndIndex - 1

                if (x1 == y1 && x2 == nextEndIndex)
                    // This is a function, take
                    return false

                return x1 <= y2 && y1 <= x2
            })

            if (functionMatchOverlapped.length > 0)
                continue

            matches.push(match)
        }

        if (matches.length === 0) {
            // There is no variable scope, which mean there shouldn't be any logical compare?
            return this.translateFunctionOrVariable(expressionStr, dataContext);
        }
        else if (matches.length === 1) {
            let matchValue = matches[0][0]

            if (matchValue == expressionStr) {
                return this.translateFunctionOrVariable(expressionStr, dataContext);
            }
        }

        // There is logical expression complex side
        return this.translateParser(matches, expressionStr, dataContext)
    }

    scanValue() {

        let {expressionStr, dataContext} = this.args;

        let readVariableFromSimpleExpressions = (simpleExpressions: string[]) => {
            simpleExpressions.forEach((value: string, _ : any) => {
                value = value.trim()

                // We just read the value to tell mobx to observe, we don't need to anything
                this.translateValue(value, dataContext)
            });
        }

        if (FetchValueMemoStorage.has(expressionStr)) {
            readVariableFromSimpleExpressions(FetchValueMemoStorage.get(expressionStr))
        }

        let matches = [];
        let match;

        let variableAndFunctionRegex = this.variableAndFunctionScopeRegex()

        while ((match = variableAndFunctionRegex.exec(expressionStr)) != null) {
            matches.push(match)
        }
        // Simple expressions that has been translated already from converters
        let simpleExpressions : string[] = []

        if (matches.length === 0) {
            // There is no variable scope, which mean there shouldn't be any logical compare?
            simpleExpressions = [...simpleExpressions, ...this.getSimpleExpressionsFromFunctionExpression(expressionStr)]
        } else {
            // There is logical expression complex side
            matches.forEach((value, _) => {

                let expressionContent = value[0];
                // check if there is a function
                simpleExpressions = [...simpleExpressions, ...this.getSimpleExpressionsFromFunctionExpression(expressionContent)];
            })
        }

        FetchValueMemoStorage.set(expressionStr, simpleExpressions)
        readVariableFromSimpleExpressions(simpleExpressions)
    }

    getSimpleExpressionsFromFunctionExpression(expressionStr: string) : string[] {
        let match = this.functionRegex().exec(expressionStr);

        if (match == null) {
            // No converter
            return [expressionStr];
        }

        let functionStr = match[0]

        let functionRegexMatch = this.functionParamsRegex().exec(functionStr)

        let finalParams: string[] = []
        let additionalParamsStr = functionRegexMatch![2]

        if (additionalParamsStr && additionalParamsStr.length > 0) {
            finalParams = additionalParamsStr.split(',')
        }

        return finalParams
    }

    translateParser(matches: RegExpExecArray[], expressionStr:string, dataContext:any){
        let hashMapKey = new Map()

        let variableStore: { [id:string] : any } = {}

        let variableIndex = 0;

        // now we have the regex matches, search for the content
        matches.forEach((value, _) => {

            let expresionContent = value[0];

            // check if there is a converter
            let expressionFinalValue = this.translateFunctionOrVariable(expresionContent, dataContext);

            let variableName = "variable_" + variableIndex++;

            variableStore[variableName] = expressionFinalValue
            hashMapKey.set(expresionContent, variableName)
        })

        let translatedExpressionStrIntoVariables = expressionStr;

        // now we have the hash map with actual value, we combine everything for final result
        hashMapKey.forEach(function(value, key) {
            while(translatedExpressionStrIntoVariables.indexOf(key) !== -1) {
                translatedExpressionStrIntoVariables = lodash.replace(translatedExpressionStrIntoVariables, key, value)
            }
        })

        return this.evalInContext(translatedExpressionStrIntoVariables, variableStore);
    }

    translateFunctionOrVariable(expressionStr: string, dataContext: any): Promise<any>|any {

        let match = this.functionRegex().exec(expressionStr);

        if (match == null) {
            // No converter
            return this.translateValue(expressionStr, dataContext);
        }

        let functionStr = match[0]

        let finalParams: any[] = []

        const openingParenthesisIndex = functionStr.indexOf('(');

        const functionStrWithoutParams = functionStr.slice(0, openingParenthesisIndex).trim();
        let additionalParamsStr = functionStr.slice(openingParenthesisIndex + 1, -1).trim();

        if (additionalParamsStr && additionalParamsStr.length > 0) {

            let constantMapping:any = {}
            let propertyIndex = 0

            let constantRegex = this.constantRegex()

            while ((match = constantRegex.exec(additionalParamsStr)) != null) {
                let matchValue = match[0]

                let propertyName = "__property_" + propertyIndex

                constantMapping[propertyName] =  matchValue
                propertyIndex++
            }

            // First we replace all constant into variables name
            for(let property in constantMapping) {
                additionalParamsStr = additionalParamsStr.replace(constantMapping[property], property)
            }

            let additionalParams = additionalParamsStr.split(',');

            let newAdditionalParams:any[] = []

            // After the split, we change them back
            additionalParams.forEach((value, index) => {
                value = value.trim()
                if (value.startsWith("__property_")) {
                    newAdditionalParams.push(constantMapping[value])
                } else {
                    newAdditionalParams.push(additionalParams[index])
                }
            })

            additionalParams = newAdditionalParams

            additionalParams.forEach((additionalParam) => {
                finalParams.push(this.translateValue(additionalParam.trim(), dataContext))
            })
        }

        finalParams.push({
            converters: converters,
            dataContext: dataContext,
            extHelpers: this.args.extras?.extHelper,
            libraries: {
                moment: moment
            }
        })

        let cfMap:any = {}

        let functionContextObj = {
            converters: converters,
            utils: utils,
            cf: cfMap, // Custom functions

            // Shortcuts
            dateFormat: converters.date.dateFormat,
            timeFormat: converters.date.timeFormat,
            dateTimeFormat: converters.date.dateTimeFormat,
            conLocale: ConditionMethods.conLocale,
            now: utils.date.now,
            isRegexValid: ConditionMethods.isRegexValid
        }

        if (functionStrWithoutParams.startsWith('cf.')) {
            let customFunctionExecutor = new CustomFunctionExecutor()

            customFunctionExecutor.setup(functionStrWithoutParams)

            cfMap = customFunctionExecutor.returnMappingObject()

            functionContextObj.cf = cfMap

            let functionToExecute = lodash.get(functionContextObj, functionStrWithoutParams)

            return functionToExecute.apply(null, finalParams)
        }

        let functionToExecute = lodash.get(functionContextObj, functionStrWithoutParams)

        return functionToExecute.apply(null, finalParams);
    }

    evalInContext(js: string, context: any) {
        return evaluate(context, js);
    }

    isExpressionUsed() {
        return true;
    }
}

class ConditionMethods {
    static conLocale(
        condition: any,
        trueStr: LocalizedKey,
        falseStr: LocalizedKey,
        {dataContext}: {dataContext:any}): Promise<string>|string {

        let finalStr = condition ? trueStr : falseStr

        return getValueFromLocalizedKey({
            expressionStr: finalStr,
            dataContext: dataContext
        })

    }

    static isRegexValid(stringToValidate: string, regexKey: string): boolean {
        let regexFileString = RegexManager.getRegexListString()

        const regexFunction = new Function('regexKey', 'stringToValidate', `
            ${regexFileString}
            return regex['${regexKey}'].test(stringToValidate);
        `)

        return regexFunction(regexKey, stringToValidate);
    }
}

function getValueFromLocalizedKey (args: ExpressionArgs): Promise<string>|string {

    if (!args.expressionStr) {
        return "";
    }

    args.extras = {
        ... InternalUtils.misc.getExtrasForCustomFunctionCall(),
        ... args.extras ?? {} }

    args.expressionStr = translate(args.expressionStr)

    return new DollarSignExpression(args).getValue()
}

function generateGetValueFromLocalizationExpressionFunc(args: ExpressionArgs): () => Promise<string> {
    return async () : Promise<string> => {
        let description = getValueFromLocalizedKey(args)

        if (description instanceof Promise) {
            return await description
        }

        return description;
    }
}

function getValueExpression(args: ExpressionArgs): Promise<any>|any {
    return new FetchValueExpression(args).getValue()
}

function getDataFromValueExpression(args : DataValueExpressionArgs): Promise<any>|any {
    let { dataContext } = args

    if (Array.isArray(args.valueDef)) {

        let validValueDef: ValueExpressionLogic|null = null

        for (let i = 0; i < args.valueDef.length; i++) {
            let eachRoute = args.valueDef[i]

            if (!eachRoute.condition) {
                validValueDef = eachRoute
                break;
            }

            let isTrue = new FetchValueExpression({ expressionStr: eachRoute.condition, dataContext: dataContext }).getValue()

            if (isTrue) {
                validValueDef = eachRoute
                break;
            }
        }

        if (!validValueDef) return null

        // Found the corresponding value to handle, now fetch the value
        return getDataFromValueExpression({ valueDef: validValueDef.value, dataContext: dataContext })

    } else {
        return getValueExpression({
            ...args,
            expressionStr: args.valueDef
        } as ExpressionArgs)
    }
}

function runFunctionExpression(args : FunctionExpressionArgs): Promise<any>|any {
    args.extras = {
        ... InternalUtils.misc.getExtrasForCustomFunctionCall(),
        ... args.extras ?? {} }

    /* For now, let's just call getValue (although the naming does not make sense), it will automatically trigger the function inside */
    return new FetchValueExpression({
        expressionStr: args.functionExpression,
        dataContext: args.dataContext,
        extras: args.extras
    }).getValue()
}

interface IExpressionFunctions  {
    getValueExpression(args: ExpressionArgs): Promise<any>|any
    runFunctionExpression(args : FunctionExpressionArgs): Promise<any>|any
    setDataValueExpression(args: ExpressionArgs, value: any):void
    getRawDataValueExpression(args: ExpressionArgs):any
    getValueFromDollarSignExpression(args: ExpressionArgs): Promise<string>|string
    scanValueFromDollarSignExpression(args: ExpressionArgs): void
    getDataFromValueExpression(args : DataValueExpressionArgs): Promise<any>|any
    getValueFromLocalizedKey (args: ExpressionArgs): Promise<string>|string
    generateGetValueFromLocalizationExpressionFunc(args: ExpressionArgs): () => Promise<string>
}

export class ExpressionFunctionsImpl implements IExpressionFunctions {
    generateGetValueFromLocalizationExpressionFunc(args: ExpressionArgs): () => Promise<string> {
        return generateGetValueFromLocalizationExpressionFunc(args)
    }

    getRawDataValueExpression(args: ExpressionArgs): any {
        return new DataExpression(args).getValue()
    }

    getValueExpression(args: ExpressionArgs): any {
        return getValueExpression(args)
    }

    getValueFromDollarSignExpression(args: ExpressionArgs): Promise<string> | string {
        return new DollarSignExpression(args).getValue()
    }

    getValueFromLocalizedKey(args: ExpressionArgs): Promise<string> | string {
        return getValueFromLocalizedKey(args)
    }

    getDataFromValueExpression(args: DataValueExpressionArgs): any {
        return getDataFromValueExpression(args)
    }

    runFunctionExpression(args: FunctionExpressionArgs): any {
        runFunctionExpression(args)
    }

    scanValueFromDollarSignExpression(args: ExpressionArgs): void {
        args.expressionStr = translate(args.expressionStr)

        return new DollarSignExpression(args).scanValue();
    }

    setDataValueExpression(args: ExpressionArgs, value: any): void {
        new DataExpression(args).setValue(value)
    }
}

let ExpressionFunctions = new ExpressionFunctionsImpl()

export default ExpressionFunctions
