import {CustomComponentRegistry} from "@skedulo/mex-engine-proxy";
export class ModuleRegistration {
    registeredModules: CustomComponentRegistry[] = []

    setRegisteredModules(registerModules: CustomComponentRegistry[]) {
        this.registeredModules = registerModules
    }

    getRegisteredModules(): CustomComponentRegistry[] {
        return this.registeredModules
    }
}
export const ModuleRegistrationInstance = new ModuleRegistration()