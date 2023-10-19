import Expressions, {FetchValueExpression} from "./expression/Expressions";
import * as lodash from 'lodash'
import {runInAction} from "mobx";
import utils from "./Utils";
import {Alert, NativeModules} from "react-native";
import AssetsManager from "../assets/AssetsManager";
import {BaseStructureObject} from "./models/BaseStructureObject";
import {NavigationContext} from "./NavigationProcessManager";
import {DataExpressionType, ListPageAddNewDefaultDataType, OrderByModel} from "@skedulo/mex-types";
import {ExtHelperImpl} from "./utils/ExtHelper";
import moment from "moment";

export function translateBracketVariablesInObject(args: { jsonDef: any, dataContext: any }) {
    let regex = /\$\(([^)]*)\)/g

    let { jsonDef, dataContext } = args;

    let jsonTemplateString = JSON.stringify(jsonDef);

    let matches = [];
    let match;
    let hashMap = new Map()

    while ((match = regex.exec(jsonTemplateString)) != null) {
        matches.push(match)
    }

    matches.forEach((value, _) => {
        let variableContent = value[1];
        let variableWithDollarSign = value[0];
        let variableContentValue = new FetchValueExpression({dataContext: dataContext, expressionStr: variableContent}).getValue();

        // if we already have the value, don't mind storing it again
        if (hashMap.has(variableWithDollarSign)) {
            return;
        }

        hashMap.set(variableWithDollarSign, variableContentValue)
    })

    var finalResult = jsonTemplateString;

    // now we have the hash map with actual value, we combine everything for final result
    hashMap.forEach(function(value, key) {

        if (!value) {
            // Make it null
            finalResult = lodash.replace(finalResult, '"' + key + '"', "null")
        }

        if (value instanceof Object
            || typeof value === "boolean") {
            // First replace with any string with double quote at the start and end
            finalResult = lodash.replace(finalResult, '"' + key + '"', JSON.stringify(value))
        }

        finalResult = lodash.replace(finalResult, key, value)
    })

    return JSON.parse(finalResult)
}

export function translateOneLevelOfExpression(args: { jsonDef: any, dataContext: any }): any {

    let { jsonDef, dataContext } = args;

    if (!jsonDef) {
        return jsonDef
    }

    let newJsonDef = lodash.clone(jsonDef)

    if (typeof jsonDef === 'string') {
        // The translation is just from a string expression
        return Expressions.getValueFromDollarSignExpression({
            dataContext: dataContext,
            expressionStr: jsonDef as string
        })
    }

    // Iterate only 1 level now
    lodash.each(newJsonDef, (val ,key) => {

        if (typeof(val) === 'string' || val instanceof String) {
            let translatedVal = Expressions.getValueFromDollarSignExpression({ dataContext: dataContext, expressionStr: val as string })

            lodash.set(newJsonDef, key, translatedVal)
        }
    })

    return newJsonDef
}

export type UpsertToExpressionArgs = {
    destinationDataExpression: string|undefined,
    sourceData: any,
    destinationDataContext: any,
    compareProperty: string|null,
    alwaysAsNewData?: boolean
}

/**
 * This method will add the data from dataExpression to destinationExpression
 */
export function upsertToExpression(
        { destinationDataExpression, sourceData, destinationDataContext, compareProperty, alwaysAsNewData }
        : UpsertToExpressionArgs) {

    alwaysAsNewData = alwaysAsNewData ?? false
    compareProperty = compareProperty ?? "UID"
    destinationDataExpression = destinationDataExpression ?? "pageData" /* If no destination expression is recognized, probably we have to set the entire pageData object again from previous page */

    let destinationSource = Expressions.getValueExpression({dataContext: destinationDataContext, expressionStr: destinationDataExpression})

    sourceData = lodash.cloneDeep(sourceData);

    // This variable is used to indicate if whether we should save the entire object to the source path, in case if it's an object, we will always do it.
    let setEntireValueToSourcePath = destinationSource instanceof Object || destinationSource === null || destinationSource === undefined
    let isDestinationSourceAsArray = alwaysAsNewData || Array.isArray(destinationSource)

    if (isDestinationSourceAsArray) {
        // If source is already an array, then no
        setEntireValueToSourcePath = false;
    }

    // Check if the UID is temp-new, turn into a valid GUID
    if (!sourceData.UID) {
        sourceData.UID = utils.data.generateUniqSerial()
    }

    if (sourceData.__isCreatingNewObject !== undefined) {
        // If the source data is gonna to be pushed to source, we're gonna to assume that it's no longer in insert state
        delete sourceData.__isCreatingNewObject
    }

    runInAction(() => {
        if (isDestinationSourceAsArray) {
            if (!destinationSource) {
                /* If we indicate that the destination source must be an array, but it's not now, we need to set the path as an array */
                destinationSource = []

                Expressions.setDataValueExpression({dataContext: destinationDataContext, expressionStr: destinationDataExpression!}, destinationSource)
            }

            // If the destination source is an array, we need to see if whether we should update an existing record or insert new one
            let existedItem = lodash.find(destinationSource, [compareProperty, sourceData.UID])

            if (existedItem) {
                // We want to remove it, so we can notify the layout (list) later that it should render the list again
                destinationSource = destinationSource.filter((item:any) => item!= existedItem)

                destinationSource.push(sourceData)

                Expressions.setDataValueExpression({dataContext: destinationDataContext, expressionStr: destinationDataExpression!}, destinationSource)
            } else {
                // If inserting new item, then we don't have to set the entire object
                destinationSource.push(sourceData)
            }

            sourceData = destinationSource
        }

        if (setEntireValueToSourcePath) {
            if (destinationDataExpression === "formData") {
               // Setting directly to root, need to have special treatment (set each properties)
                for (const propertyName in sourceData) {
                    Expressions.setDataValueExpression({dataContext: destinationDataContext, expressionStr: destinationDataExpression + "." + propertyName}, sourceData[propertyName])
                }
            }  else {
                Expressions.setDataValueExpression({dataContext: destinationDataContext, expressionStr: destinationDataExpression!}, sourceData)
            }
        }
    })
}

function removeData ({dataStructure, destinationDataContext, destinationExpression, compareProperty}: { dataStructure: any, destinationExpression: string, destinationDataContext: any, compareProperty: string }) {
    compareProperty = compareProperty ?? "UID"

    let source = Expressions.getValueExpression({dataContext: destinationDataContext, expressionStr: destinationExpression})

    if (!source) {
        throw Error("Can't find source")
    }

    let existedItem = lodash.find(source, [compareProperty, dataStructure[compareProperty]])
    if (existedItem) {
        runInAction(() => {
            lodash.remove(source, existedItem)
        })
    }
}


function createTempObject(
    defaultData: ListPageAddNewDefaultDataType,
    dataContext: any): any {

    let tempObjectData = translateOneLevelOfExpression({jsonDef: defaultData.data, dataContext})

    tempObjectData.__typename = defaultData.objectName
    tempObjectData.__isTempObject = true
    tempObjectData.__isCreatingNewObject = true /* This flag is used to indicate that we're creating new object */
    tempObjectData.UID = utils.data.generateUniqSerial()

    return tempObjectData
}

function alert ({title, description, yesText, noText}: { title: string, description: string, yesText: string, noText: string }){
    return new Promise((resolve, _) => {
        Alert.alert(
            title,
            description,
            [
                {
                    text: noText,
                    onPress: () => resolve(false),
                    style: "cancel"
                },
                { text: yesText, onPress: () => resolve(true) }
            ])
    })
}

function alwaysTranslateTextIntoPromise(expressionStr: string, dataContext: any) {
    let textOrPromise = Expressions.getValueFromLocalizedKey({expressionStr, dataContext})

    if (textOrPromise instanceof Promise) {
        return textOrPromise
    }

    return Promise.resolve(textOrPromise);
}

function getKeyFromObject(fromObject: BaseStructureObject) : any {
    let {__typename, UID} = fromObject

    if (!__typename || !UID) return null

    return `${__typename}:${UID}`
}

function dataSourceIsFormLevel(expression: string) : boolean {
    let parts = expression.split('.')

    return parts.length > 0 && parts[0] === "formData"
}

function markAndLoopParentsAsInvalid(currentNavigationContext: NavigationContext) {
    let previousNavigationContext = currentNavigationContext.prevPageNavigationContext;

    runInAction(() => {
        while (previousNavigationContext && previousNavigationContext.currentDataContext?.pageData?.__typename) {
            // If looping through typename, mark these parent as pending
            previousNavigationContext.currentDataContext.pageData.__invalid = true;

            previousNavigationContext =  previousNavigationContext.prevPageNavigationContext;
        }
    })
}

function isSavingOnFormData (currentNavigationContext: NavigationContext): boolean {
    let currentDataContext = currentNavigationContext.currentDataContext?.pageData;

    if (currentNavigationContext.sourceExpression?.startsWith("formData.")
        || (currentDataContext?.__isTempObject === false)) {
        // If current data is not temp object, we save as draft
        return true;
    }

    return false
}

function isTempUID(object: any) : boolean {
    return object?.UID && object.UID.startsWith("temp-")
}

export type FilterByExpressionInfo = {
    expression: DataExpressionType,
    dataContext: any
}

const getFilterSourceByKeywords = function(
    source: any[],
    searchText: string|null,
    filterOnProperties: string[]|undefined,
    filterByExpression?: FilterByExpressionInfo) : any[]
{

    if ((!searchText || searchText === "") && !filterByExpression) {
        return source
    }

    return lodash.filter(source, function (item) {

        let filterObject: any = {}

        let isMatch = true;

        if (searchText && searchText !== "") {
            if (filterOnProperties) {
                let isMatchForFilterOnProperties = false
                // translate property
                filterOnProperties.forEach((prop: any) => {
                    filterObject[prop] = Expressions.getValueExpression({
                        expressionStr: `${prop}`,
                        dataContext: item
                    });
                })

                lodash.forEach(filterObject, (value, _) => {

                    if (value && searchText && value.toLowerCase().includes(searchText.toLowerCase())) {
                        isMatchForFilterOnProperties = true;
                        return false;
                    }
                    return true;
                });

                isMatch = isMatchForFilterOnProperties
            }
        else if (typeof item === 'string') {
            /* This properly is not necessary anymore, but we still keep this */
                isMatch = item.toLowerCase().includes(searchText.toLowerCase())
            }
            else if (item?.Label && item?.Value) {
                /* Probably vocab */
                isMatch = item.Label.toLowerCase().includes(searchText.toLowerCase())
            }
        }

        if (isMatch && filterByExpression) {
            isMatch = Expressions.getValueExpression({expressionStr: filterByExpression.expression, dataContext: { ...filterByExpression.dataContext, item: item }})
        }

        return isMatch
    });
}

function getExtrasForCustomFunctionCall (): any {
    return {
        extHelper: new ExtHelperImpl(),
        libraries: {
            moment: moment
        }
    };
}

function sortListByExpression(source: any[], orderBy: OrderByModel) {
    if (!source) {
        return source
    }

    const { expression } = orderBy

    const keys:string[] = []
    const logics:(boolean|"asc"|"desc")[] = []

    expression.forEach((pair) => {
        const keyLogic = pair.split(" ")

        if (keyLogic.length != 2){
            throw Error(`Invalid format for orderBy ${expression}`)
        }

        keys.push(keyLogic[0])
        logics.push(keyLogic[1] as (boolean|"asc"|"desc"))
    })

    return lodash.orderBy(source, keys, logics)
}

function getMandatoryExpressionValue(def: boolean|DataExpressionType|undefined, dataContext: any): boolean {
    // fall back this value to true in case mandatory expression is undefined to bypass 'isCompleted' form checking
    if (!def) {
        return true;
    }

    if (typeof def === 'boolean') {
        return def as boolean
    }

    return Expressions.getValueExpression({expressionStr: def as DataExpressionType, dataContext: dataContext}) ?? false
}

const InternalUtils =  {
    data: {
        removeData,
        createTempObject,
        upsertToExpression,
        translateOneLevelOfExpression,
        alwaysTranslateTextIntoPromise,
        getKeyFromObject,
        dataSourceIsFormLevel,
        markAndLoopParentsAsInvalid,
        isSavingOnFormData,
        isTempUID,
        getFilterSourceByKeywords,
        orderListByExpression: sortListByExpression,
        getMandatoryExpressionValue
    },
    navigation: {
        exit: function () {
            AssetsManager.dispose()

            NativeModules.MexMainModule.exit("")
        }
    },
    ui: {
        alert: alert
    },
    misc : {
        getExtrasForCustomFunctionCall
    }
}

export default InternalUtils
