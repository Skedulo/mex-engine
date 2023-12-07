import { useMemo} from "react";
import * as lodash from "lodash";
import * as React from "react";
import {Dictionary} from "lodash";
import {GroupByFeatureModel} from "@skedulo/mex-types/dist/common/CommonTypes";

export const useHasSection = (source: any[], dataContext: any, hasSection?: GroupByFeatureModel): any[] => {

    return useMemo<{ data: any[], title?: string }[]>(() => {

        if (!source || source.length === 0) {
            // If there is no data, return empty
            return []
        }

        if (!hasSection) {
            // Make a new list, otherwise mobx will yield some errors regarding incorrect usage inside SectionList
            return [{data: [...source]}]
        }

        let groupByData = lodash.groupBy(source, hasSection.sectionTitleProperty) as Dictionary<any[]>

        let result: { data: any[], title?: string }[] = []

        for (let key in groupByData) {

            result.push({title: key === 'undefined' || key === 'null' ? undefined : key, data: groupByData[key]})
        }

        return result
    }, [source, source.length])
};
