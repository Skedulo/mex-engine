import {CustomComponentRegistry} from "@skedulo/mex-engine-proxy";
class ModuleRegistration {

    registeredModules: CustomComponentRegistry[] = []

    // @ts-ignore
    async scanModulePages(): Promise<CustomComponentRegistry[]> {
    }

    async initialize() {
        const registries = await this.scanModulePages()
        this.registeredModules = registries ?? []
    }

    getRegisteredModules(): CustomComponentRegistry[] {
        return this.registeredModules
    }
}

export const ModuleRegistrationInstance = new ModuleRegistration()