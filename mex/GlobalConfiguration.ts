'use strict'

export enum DevelopmentModeConfigEnum {
    UseLocalInstanceData = "UseLocalInstanceData",
    UseLocalStaticData = "UseLocalStaticData",
    UseLocalUIDefinition = "UseLocalUIDefinition",
    UseLocalTranslationFiles = "UseLocalTranslationFiles",
    UseLocalCustomFunctions = "UseLocalCustomFunctions",
    UseLocalFormMetadata = "UseLocalFormMetadata",
}

export type DevelopmentFormConfig = {
    FormData: () => any,
    StaticData?: () => any,
    UiDef: () => any,
    Languages: [{ tag: string, content: () => any}],
    FormMetadata: () => any,
}

class GlobalConfig {

    EnableDevelopment: boolean =  __DEV__
    FormName: string = "local"

    DevelopmentFormConfig: Map<string, DevelopmentFormConfig> = new Map<string, DevelopmentFormConfig>()

    constructor() {
        this.DevelopmentFormConfig.set("local", {
            FormData: () => require("../local_data/instance_data.json"),
            StaticData: () => require("../local_data/static_data.json"),
            UiDef: () => require("../local_data/ui_def.json"),
            Languages: [{
                tag: "en",
                content: () => require("../local_data/resources/locale/en.json")
            }],
            FormMetadata: () => require("../local_data/metadata.json"),
        })

        // Uncomment these to reduce package size, otherwise these files will be included in the engine
        // this.DevelopmentFormConfig.set("showcase", {
        //     FormData: () => require("../mex-test-forms/showcase/fake_data/instance_data.json"),
        //     StaticData: () => require("../mex-test-forms/showcase/fake_data/instance_data.json"),
        //     UiDef: () => require("../mex-test-forms/showcase/mex_definition/ui_def.json"),
        //     Languages: [{
        //         tag: "en",
        //         content: () => require("../mex-test-forms/showcase/mex_definition/static_resources/locales/en.json")
        //     }]
        // })
        //
        // this.DevelopmentFormConfig.set("leave", {
        //     FormData: () => require("../mex-test-forms/leave_management/fake_data/instance_data.json"),
        //     StaticData: () => require("../mex-test-forms/leave_management/fake_data/static_data.json"),
        //     UiDef: () => require("../mex-test-forms/leave_management/mex_definition/ui_def.json"),
        //     Languages: [{
        //         tag: "en",
        //         content: () => require("../mex-test-forms/leave_management/mex_definition/static_resources/locales/en.json")
        //     }]
        // })
        //
        // this.DevelopmentFormConfig.set("lone", {
        //     FormData: () => require("../mex-test-forms/lone_worker_checkin/fake_data/instance_data.json"),
        //     StaticData: () => require("../mex-test-forms/lone_worker_checkin/fake_data/static_data.json"),
        //     UiDef: () => require("../mex-test-forms/lone_worker_checkin/mex_definition/ui_def.json"),
        //     Languages: [{
        //         tag: "en",
        //         content: () => require("../mex-test-forms/lone_worker_checkin/mex_definition/static_resources/locales/en.json")
        //     }]
        // })
        //
        // this.DevelopmentFormConfig.set("foodreview", {
        //     FormData: () => require("../mex-test-forms/food_review/fake_data/instance_data.json"),
        //     StaticData: () => require("../mex-test-forms/food_review/fake_data/static_data.json"),
        //     UiDef: () => require("../mex-test-forms/food_review/mex_definition/ui_def.json"),
        //     Languages: [{
        //         tag: "en",
        //         content: () => require("../mex-test-forms/food_review/mex_definition/static_resources/locales/en.json")
        //     }]
        // })
    }

    private DevelopmentModeConfig = {
        [DevelopmentModeConfigEnum.UseLocalInstanceData]: false,
        [DevelopmentModeConfigEnum.UseLocalStaticData]: false,
        [DevelopmentModeConfigEnum.UseLocalUIDefinition]: true,
        [DevelopmentModeConfigEnum.UseLocalTranslationFiles]: false,
        [DevelopmentModeConfigEnum.UseLocalCustomFunctions]: false,
        [DevelopmentModeConfigEnum.UseLocalFormMetadata]: false
    }

    canUseDevelopmentConfig(config: DevelopmentModeConfigEnum) {
        return this.EnableDevelopment && this.DevelopmentModeConfig[config]
    }

    getDevelopmentFormConfig(): DevelopmentFormConfig {
        return this.DevelopmentFormConfig.get(this.FormName)!
    }
}

export default new GlobalConfig() as GlobalConfig
