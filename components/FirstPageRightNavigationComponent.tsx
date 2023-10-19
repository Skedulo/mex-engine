import * as React  from "react";
import {useCallback, useEffect, useState} from "react";
import {translate} from "../mex/assets/LocalizationManager";
import DraftManager from "../mex/assets/DraftManager";
import {NavigationItemsView, RightNavigationItem} from "./NavigationItemsView";

export type FirstPageRightNavigationComponentProps = {
    submit: (() => Promise<boolean>) | undefined
    items?: RightNavigationItem[]
}

export let FirstPageRightNavigationComponent: React.FC<FirstPageRightNavigationComponentProps> = (props) => {

    let saveButtonText = translate("builtin_save")
    let [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false)

    let registerChangeCallback = useCallback((key:string) => {
        if (key !== DraftManager.keys.instanceDataDraftKey()) {
            return;
        }

        checkPendingChanges()
    }, [])

    let checkPendingChanges = function() {
        DraftManager.getDraft(DraftManager.keys.instanceDataDraftKey()).then((data) => {
            let pendingChange = data != null

            if (pendingChange == hasPendingChanges) {
                return
            }

            setHasPendingChanges(pendingChange)
        })
    }

    useEffect(() => {
        checkPendingChanges()

        DraftManager.registerChangesCallback(registerChangeCallback)

        return () => {
            DraftManager.removeChangesCallback(registerChangeCallback)
        }
    })

    let items: RightNavigationItem[] = props.items !== undefined ? [...props.items] : []

    items.push({
        onClicked: props.submit,
        text: saveButtonText
    })

    // Enable this if we want to observe the changes
    // if (!hasPendingChanges) {
    //     return null;
    // }

    return (<NavigationItemsView items={items} />)
}
