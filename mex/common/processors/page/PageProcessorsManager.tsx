import ListPageProcessor from "./ListPageProcessor";
import FlatPageProcessor from "./FlatPageProcessor";

type Processor = ListPageProcessor|FlatPageProcessor

class PageProcessorManager {
    processors: Processor[]

    constructor() {
        this.processors = [
            new ListPageProcessor,
            new FlatPageProcessor
        ]
    }

    findProcessor(typeName: string): Processor|null {
        let processor = this.processors.find(p => p.getTypeName() === typeName)

        return processor ?? null
    }
}

export default new PageProcessorManager() as PageProcessorManager

