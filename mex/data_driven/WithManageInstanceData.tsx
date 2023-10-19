import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import AssetsManager from "../assets/AssetsManager";

export const InstanceDataContext = React.createContext(AssetsManager.getInstanceData());

export type Props = {
    children: JSX.Element,
}

const WithManageInstanceData: React.FC<Props> = ({ children }) => {
    let [instanceData, setInstanceData] = useState(AssetsManager.getInstanceData())

    let instanceDataChanged = useCallback((newInstanceData: any) => {
        setInstanceData(newInstanceData)
    }, [])

    useEffect(() => {
        AssetsManager.registerInstanceDataCallChangedCallback(instanceDataChanged)

        return () => {
            AssetsManager.removeInstanceDataCallChangedCallback(instanceDataChanged)
        }
    })

    return (<InstanceDataContext.Provider value={instanceData}>
        {children}
    </InstanceDataContext.Provider>)
}

export default WithManageInstanceData
