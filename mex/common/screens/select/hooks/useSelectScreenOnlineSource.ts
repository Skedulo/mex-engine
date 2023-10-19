import  {PageLevelDataContext} from "../../../../assets/AssetsManager";
import {NoInternetError, useSearchOnline} from "../../../../hooks/useAPI";
import {SelectPageConfig} from "@skedulo/mex-types";

type Props = {
    selectPageConfig: SelectPageConfig
    dataContext: PageLevelDataContext
    searchText: string,
    variables: any
}

type Result = {
    data?: any[]
    status: OnlineSourceStatus
}

export enum OnlineSourceStatus {
    Loading,
    Loaded,
    RequireInternetConnection,
    Failed
}

export const useSelectScreenOnlineSource = (props: Props): Result => {
    let {variables} = props

    let { isLoading, data, error } = useSearchOnline(
        props.selectPageConfig.onlineSource!.key,
        {searchText: props.searchText, ...variables})

    if (error instanceof NoInternetError) {
        return { status: OnlineSourceStatus.RequireInternetConnection }
    }

    if (error) {
        return { status: OnlineSourceStatus.Failed }
    }

    if (isLoading) {
        return { status: OnlineSourceStatus.Loading }
    }

    return { status: OnlineSourceStatus.Loaded, data: data }
};
