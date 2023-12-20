import useAxios, {Options} from "axios-hooks";
import {useAccessToken} from "./useAccessToken";
import {useBaseUrl} from "./useBaseUrl";
import {useEffect} from "react";
import AssetsManager from "../assets/AssetsManager";
import {useNetInfo} from "@react-native-community/netinfo";
import {AxiosRequestConfig} from "axios";

type APIResult<T> = {
    isLoading: boolean,
    error?: Error,
    data?: T
}

export class NoInternetError extends Error {}

function useCustomAxios<TResponse>(url: string, variables: any): APIResult<TResponse> {
    let accessToken = useAccessToken()
    let baseUrl = useBaseUrl()
    let netInfo = useNetInfo()

    let [axiosResult, executeApiReq] = useAxios<TResponse>(
        {
            baseURL: baseUrl ?? "",
            url: url,
            headers: {
                Authorization: 'Bearer ' + accessToken
            },
            method: "POST",
            data: variables
        },
        {
            manual: true,
            useCache: false
        }
    )

    useEffect(() => {
        if (accessToken && baseUrl && netInfo.isConnected) {
            executeApiReq()
                .catch(err => {
                    console.log("err when calling api", err)
                })
        }
    }, [baseUrl, accessToken, executeApiReq, netInfo.isConnected])

    if (!netInfo.isConnected) {
        return { isLoading: false, error: new NoInternetError() }
    }

    if (axiosResult.error) {
        console.log("err when calling api", axiosResult.error)

        return { isLoading: false, error: new Error("Something wrong when calling API")};
    }

    return { isLoading: axiosResult.loading, data: axiosResult.data};
}

export const useSearchOnline = (key: string, variables: any):APIResult<any[]> => {
    return useCustomAxios(`/mobile/v3/api/user/mex/onlineSearch`, {
        mexDefUID: AssetsManager.cachedPackageId,
        label: key,
        variables: variables
    })
}


export const useSkedAPI = <TResponse = any, TBody = any>(config: AxiosRequestConfig<TBody> | string, options?: Options): APIResult<TResponse> =>
{
    let accessToken = useAccessToken()
    let baseUrl = useBaseUrl()
    let netInfo = useNetInfo()

    config = {
        ... {
            baseURL: baseUrl ?? "",
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        },
        ...config
    }

    options = {
        ... {
            manual: true,
            useCache: false
        },
        ...options
    }

    let [axiosResult, executeApiReq] = useAxios<TResponse>(
        config,
        options
    )

    useEffect(() => {
        if (accessToken && baseUrl && netInfo.isConnected) {
            executeApiReq()
                .catch(err => {
                    console.log("err when calling api", err)
                })
        }
    }, [baseUrl, accessToken, executeApiReq, netInfo.isConnected])

    if (!netInfo.isConnected) {
        return {isLoading: false, error: new NoInternetError()}
    }

    if (axiosResult.error) {
        console.log("err when calling api", axiosResult.error)

        return {isLoading: false, error: new Error("Something wrong when calling API")};
    }

    return {isLoading: axiosResult.loading, data: axiosResult.data};
}

export const useAPI = <TResponse = any, TBody = any>(config: AxiosRequestConfig<TBody> | string, options?: Options): APIResult<TResponse> =>
{
    let netInfo = useNetInfo()

    options = {
        ... {
            manual: true,
            useCache: false
        },
        ...options
    }

    let [axiosResult, executeApiReq] = useAxios<TResponse>(
        config,
        options
    )

    useEffect(() => {
        if (netInfo.isConnected) {
            executeApiReq()
                .catch(err => {
                    console.log("err when calling api", err)
                })
        }
    }, [executeApiReq, netInfo.isConnected])

    if (!netInfo.isConnected) {
        return {isLoading: false, error: new NoInternetError()}
    }

    if (axiosResult.error) {
        console.log("err when calling api", axiosResult.error)

        return {isLoading: false, error: new Error("Something wrong when calling API")};
    }

    return {isLoading: axiosResult.loading, data: axiosResult.data};
}
