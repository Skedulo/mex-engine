import {useEffect, useMemo, useReducer, useRef} from "react";
import {PageLevelDataContext} from "../../../../assets/AssetsManager";
import Expressions from "../../../expression/Expressions";
import InternalUtils from "../../../InternalUtils";
import {SelectPageConfig} from "@skedulo/mex-types";

type Props = {
    selectPageConfig: SelectPageConfig
    dataContext: PageLevelDataContext
    searchText: string
}

type Result = {
    data: any[]
}

export const useSelectScreenOfflineSource = (props: Props): Result => {
    const sourceRef = useRef<any[]>([])

    const {selectPageConfig, dataContext, searchText} = props

    const [, forceUpdate] = useReducer(x => x + 1, 0)

    useEffect(() => {

        if (sourceRef.current.length > 0)
            return;

        let allSource = Expressions.getValueExpression({
            expressionStr: selectPageConfig.dataSourceExpression,
            dataContext: dataContext
        })

        if (!selectPageConfig.filterExpression) {
            // no filter, return all result
            sourceRef.current = allSource
            forceUpdate()
            return
        }

        let filteredSource: any[] = []
        let filteredTask: Promise<any>[] = []

        allSource.forEach((item: any) => {

            const addWhenValid = (isValid: any) => {
                if (isValid) {
                    filteredSource.push(item)
                }
            }

            let isValidTask = Expressions.getValueExpression({
                expressionStr: selectPageConfig.filterExpression!,
                dataContext: {
                    ...dataContext,
                    item,
                }
            })

            if (isValidTask instanceof Promise) {
                filteredTask.push(isValidTask.then(addWhenValid))
            } else {
                addWhenValid(isValidTask)
            }
        })

        Promise.all(filteredTask).then(() => {
            sourceRef.current = filteredSource
            forceUpdate()
        })

    }, [])

    let finalSource:any[] = []

    finalSource = useMemo<any[]>(() => {
        if (sourceRef.current && selectPageConfig.searchBar) {
            return InternalUtils.data.getFilterSourceByKeywords(
                sourceRef.current,
                searchText,
                selectPageConfig.searchBar.filterOnProperties
            );
        }

        return sourceRef.current

    }, [searchText, sourceRef.current]);

    return {data: finalSource};
};
