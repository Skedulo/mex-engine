import {useEffect, useMemo, useState} from "react";
import AssetsManager from "../../assets/AssetsManager";
import InternalUtils from "../../common/InternalUtils";
import {OrderByModel} from "@skedulo/mex-types";

export const useOrderBy = (source: any[], orderBy: OrderByModel) => {
    source = useMemo(() => InternalUtils.data.orderListByExpression(source, orderBy), [source, source.length])

    return source
};
