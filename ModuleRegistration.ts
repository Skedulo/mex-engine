import {CustomComponentRegistry} from "@skedulo/mex-engine-proxy";
export class ModuleRegistration {

    registeredModules: CustomComponentRegistry[] = []

    // @ts-ignore
    async scanCustomModules(): Promise<CustomComponentRegistry[]> {
    }

    async registerCustomModules() {
        const registries = await this.scanCustomModules()
        this.setRegisteredModules(registries ?? [])
    }

    getRegisteredModules(): CustomComponentRegistry[] {
        return this.registeredModules
    }

    setRegisteredModules(registeredModules: CustomComponentRegistry[]) {
        this.registeredModules = registeredModules
    }
}

export const ModuleRegistrationInstance = new ModuleRegistration()