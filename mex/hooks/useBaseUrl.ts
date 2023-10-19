import {useState, useEffect} from 'react';
import AssetsManager from "../assets/AssetsManager";

export const useBaseUrl = () => {
    const [baseUrl, setBaseUrl] = useState<string|null>(null)

    useEffect(() => {
        AssetsManager.getAPIUrl().then((u) => {
            setBaseUrl(u)
        })
    }, [])

    return baseUrl;
};
