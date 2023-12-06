import {useCallback, useMemo} from "react";
import * as lodash from "lodash";
import * as React from "react";
import {Dictionary} from "lodash";
import {GroupByFeatureModel} from "@skedulo/mex-types/dist/common/CommonTypes";
import {ListPageSectionHeaderComponent} from "../../../components/ListPage/ListPageSectionHeader";

export const useHasSection = (source: any[], dataContext: any, hasSection?: GroupByFeatureModel): [any[], ({section: {title}}: any) => (JSX.Element)] => {

    const renderSectionHeader = useCallback(({section: {title}}:any) => {
        if (!hasSection)
            return <></>

        let dataContext:any = {
            ...dataContext,
            sectionItem: {title: title}
        }

        return <ListPageSectionHeaderComponent title={hasSection!.sectionTitleText} dataContext={dataContext} />
    }, [dataContext])

    return useMemo<[{ data: any[], title?: string }[], ({section: {title}}: any) => (JSX.Element)]>(() => {

        if (!source || source.length === 0) {
            // If there is no data, return empty
            return [[], renderSectionHeader]
        }

        if (!hasSection) {
            // Make a new list, otherwise mobx will yield some errors regarding incorrect usage inside SectionList
            return [[{data: [...source]}], renderSectionHeader]
        }

        let groupByData = lodash.groupBy(source, hasSection.sectionTitleProperty) as Dictionary<any[]>

        let result: { data: any[], title?: string }[] = []

        for (let key in groupByData) {

            result.push({title: key === 'undefined' || key === 'null' ? undefined : key, data: groupByData[key]})
        }

        return [result, renderSectionHeader]
    }, [source, source.length, renderSectionHeader])
};
