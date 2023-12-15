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
        ModuleRegistrationInstance.getRegisteredModules().forEach(module => {
            const customListPageViewComponentProcessors = module.getRegisteredListPageItemComponentProcessors() ?? []
            this.processors = [...this.processors, ...customListPageViewComponentProcessors]
        })
    }

    findProcessor(typeName: string): ProcessorType|null {
        let processor = this.processors.find(p => p.getTypeName() === typeName)

        return processor ?? null
    }
}

export default new ListViewProcessorManager() as ListViewProcessorManager

