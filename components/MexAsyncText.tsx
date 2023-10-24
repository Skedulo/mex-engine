import * as React from "react";
import {useAsync} from "react-async";
import {MexAsyncProps} from "@skedulo/mex-engine-proxy";

const MexAsyncText: React.FC<MexAsyncProps> = ({promiseFn, children}: MexAsyncProps) => {

    const state = useAsync<string>({ promiseFn: promiseFn})
    const { isPending, data, error } = state;

    if (error) {
        return children(error.message)
    }

    if (isPending) {
        return children("")
    }

    return children(data  ?? "")
}

export default MexAsyncText
