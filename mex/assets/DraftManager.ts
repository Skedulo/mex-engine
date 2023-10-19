import {BaseStructureObject} from "../common/models/BaseStructureObject";
import AssetsManager from "./AssetsManager";
import MexSimpleStorageModuleMapper from "../common/modules/MexSimpleStorageModuleMapper"
type DraftData = BaseStructureObject & any

class DraftManager {

    keys = {
        instanceDataDraftKey: () => "MEX|" + AssetsManager.cachedPackageId + "|" + AssetsManager.cachedContextId + "|instanceData"
    }

    draftDataChangedCallbacks: any[] = []

    async saveDraft(key: string, obj: DraftData) : Promise<void> {

        await MexSimpleStorageModuleMapper.setByKey(key, JSON.stringify(obj))

        this.notifyChangesCallback(key)
    }

    async getDraft(key: string) : Promise<any> {
        let draftStr = await MexSimpleStorageModuleMapper.getByKey(key)

        if (!draftStr) {
            return null
        }

        return JSON.parse(draftStr)
    }

    notifyChangesCallback(key: string) {
        this.draftDataChangedCallbacks.forEach(c => c(key))
    }

    registerChangesCallback(callback: any) {
        this.draftDataChangedCallbacks.push(callback)
    }

    removeChangesCallback(callback: any) {
        let index = -1;

        do {
            let index = this.draftDataChangedCallbacks.indexOf(callback)

            if (index !== -1) {
                this.draftDataChangedCallbacks = this.draftDataChangedCallbacks.slice(index, 1)
            }
        } while (index !== -1)
    }


    async getDraftForNew(objType: string) : Promise<any> {

        let key = await MexSimpleStorageModuleMapper.getByKey("new_draft|" + objType)

        if (!key) {
            return null;
        }

        let draftStr = await MexSimpleStorageModuleMapper.getByKey(key)

        if (!draftStr) {
            return null
        }

        return JSON.parse(draftStr)
    }

    async removeDraft(key: string) {
        await MexSimpleStorageModuleMapper.removeByKey(key)

        this.notifyChangesCallback(key)
    }

    async removeDraftForNew(objType: string) {

        let key = await MexSimpleStorageModuleMapper.getByKey("new_draft|" + objType)

        if (!key) {
            return
        }

        await this.removeDraft(key)

        await MexSimpleStorageModuleMapper.removeByKey("new_draft|" + objType)
    }

}

export default new DraftManager() as DraftManager
