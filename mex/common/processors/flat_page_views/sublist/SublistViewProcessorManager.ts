import SublistTitleAndCaptionViewProcessor from "./SublistTitleAndCaptionViewProcessor";

type ProcessorType = SublistTitleAndCaptionViewProcessor

class SubListViewProcessorManager {
    processors: ProcessorType[]

    constructor() {
        this.processors = [
            new SublistTitleAndCaptionViewProcessor(),
        ]
    }

    findProcessor(typeName: string): ProcessorType|null {
        let processor = this.processors.find(p => p.getTypeName() === typeName)

        return processor ?? null
    }
}

export default new SubListViewProcessorManager() as SubListViewProcessorManager
