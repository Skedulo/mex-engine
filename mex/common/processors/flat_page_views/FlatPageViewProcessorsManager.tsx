import TextEditorViewProcessor from "./TextEditorViewProcessor";
import SelectEditorViewProcessor from "./SelectEditorViewProcessor";
import AttachmentsEditorViewProcessor from "./AttachmentsEditorViewProcessors";
import DateTimeEditorViewProcessor from "./DatetimeEditorViewProcessor";
import ToggleEditorViewProcessor from "./ToggleEditorViewProcessor";
import SubListEditorViewProcessor from "./SublistEditorViewProcessor";
import SectionViewProcessor from "./SectionViewProcessor";
import ReadonlyTextViewProcessor from "./ReadonlyTextViewProcesor";
import SignatureEditorViewProcessor from "./SignatureEditorViewProcessors";
import MultiSelectEditorViewProcessor from "./MultiSelectEditorViewProcessor";
import ContactDetailsLayoutProcessor from "./contact_details/ContactDetailsViewProcessor";
import BodyMapEditorViewProcessor from "./BodyMapEditorViewProcessor";
import ButtonGroupViewProcessor from "./ButtonGroupViewProcessor";
import MenuListViewProcessor from "./MenuListViewProcessor";

type ProcessorType = TextEditorViewProcessor
    |SelectEditorViewProcessor
    |AttachmentsEditorViewProcessor
    |DateTimeEditorViewProcessor
    |ToggleEditorViewProcessor
    |SubListEditorViewProcessor
    |SectionViewProcessor
    |ReadonlyTextViewProcessor
    |SignatureEditorViewProcessor
    |MultiSelectEditorViewProcessor
    |ContactDetailsLayoutProcessor
    |BodyMapEditorViewProcessor
    |ButtonGroupViewProcessor
    |MenuListViewProcessor

class FlatPageViewProcessorsManager {
    processors: ProcessorType[]

    constructor() {
        this.processors = [
            new TextEditorViewProcessor(),
            new SelectEditorViewProcessor(),
            new AttachmentsEditorViewProcessor(),
            new DateTimeEditorViewProcessor(),
            new ToggleEditorViewProcessor(),
            new SubListEditorViewProcessor(),
            new SectionViewProcessor(),
            new ReadonlyTextViewProcessor(),
            new SignatureEditorViewProcessor(),
            new MultiSelectEditorViewProcessor(),
            new ContactDetailsLayoutProcessor(),
            new BodyMapEditorViewProcessor(),
            new ButtonGroupViewProcessor(),
            new MenuListViewProcessor()
        ]
    }

    findProcessor(typeName: string): ProcessorType|null {
        let processor = this.processors.find(p => p.getTypeName() === typeName)

        return processor ?? null
    }
}

export default new FlatPageViewProcessorsManager() as FlatPageViewProcessorsManager

