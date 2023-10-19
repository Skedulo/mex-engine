import TitleAndCaptionViewProcessor from "./TitleAndCaptionViewProcessor";

type ProcessorType = TitleAndCaptionViewProcessor

class ListViewProcessorManager {
    processors: ProcessorType[]

    constructor() {
        this.processors = [
            new TitleAndCaptionViewProcessor(),
        ]
    }

    findProcessor(typeName: string): ProcessorType|null {
        let processor = this.processors.find(p => p.getTypeName() === typeName)

        return processor ?? null
    }
}

export default new ListViewProcessorManager() as ListViewProcessorManager

