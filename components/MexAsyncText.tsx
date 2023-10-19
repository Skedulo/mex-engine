import * as React from "react";
import {PromiseFn, useAsync} from "react-async";

type Props = {
    children: (text: string) => JSX.Element|null
    promiseFn: PromiseFn<string>
}

const MexAsyncText: React.FC<Props> = ({promiseFn, children}: Props) => {

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
