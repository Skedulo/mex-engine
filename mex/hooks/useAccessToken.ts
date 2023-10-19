import {useState, useEffect} from 'react';
import AssetsManager from "../assets/AssetsManager";

export const useAccessToken = () => {
    const [token, setAccessToken] = useState<string|null>(null)

    useEffect(() => {
        AssetsManager.getAccessToken().then((t) => {
            setAccessToken(t)
        })
    }, [])

    return token;
};
