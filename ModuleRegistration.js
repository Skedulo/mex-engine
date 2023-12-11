class ModuleRegistration {

    registeredModules = []

    // @ts-ignore
    async scanCustomModules() {
    }

    async registerCustomModules() {
        const registries = await this.scanCustomModules()
        this.setRegisteredModules(registries ?? [])
    }

    getRegisteredModules() {
        return this.registeredModules
    }

    setRegisteredModules() {
        this.registeredModules = registeredModules
    }
}

export const ModuleRegistrationInstance = new ModuleRegistration()