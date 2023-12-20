import TitleAndCaptionViewProcessor from "./TitleAndCaptionViewProcessor";
import {ModuleRegistrationInstance} from "../../../../ModuleRegistration";
import {ListPageProcessorInterface} from "@skedulo/mex-engine-proxy";

type ProcessorType = TitleAndCaptionViewProcessor | ListPageProcessorInterface

class ListViewProcessorManager {
    processors: ProcessorType[]

    constructor() {
        this.processors = [
            new TitleAndCaptionViewProcessor(),
        ]
    }

    loadCustomProcessors() {
        const customProcessors = ModuleRegistrationInstance.getRegisteredModules()
            .flatMap(module => module.getRegisteredListPageItemComponentProcessors() ?? [])
        this.processors = [...this.processors, ...customProcessors]
    }

    findProcessor(typeName: string): ProcessorType|null {
        let processor = this.processors.find(p => p.getTypeName() === typeName)

        return processor ?? null
    }
}

export default new ListViewProcessorManager() as ListViewProcessorManager

