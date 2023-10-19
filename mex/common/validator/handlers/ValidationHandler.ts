import {ValidatorDefinitionModel} from "@skedulo/mex-types";

export type ValidationArgs = {
    dataContext: any,
    jsonDef: ValidatorDefinitionModel|undefined,
}

export abstract class ValidationHandler {
    abstract validate(args: ValidationArgs): [boolean, string|undefined]|Promise<[boolean, string|undefined]>

    abstract runThroughExpression(args: ValidationArgs): void

    abstract getTypeName(): string
}

