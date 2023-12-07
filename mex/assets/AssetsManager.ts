import {NativeModules} from "react-native";
import * as lodash from "lodash";
import {makeAutoObservable} from "mobx";
import GlobalConfiguration, {DevelopmentModeConfigEnum} from "../GlobalConfiguration";
import DraftManager from "./DraftManager";
import {UIDefinition} from "@skedulo/mex-types";
import custom_function from "../../local_data/custom_function";
import LogManager from "../common/LogManager";
import {
    FormMetadata,
    IAssetsManager,
    InternalUtilsType,
    Metadatacontext, OrgPreferences, PageLevelDataContext,
    TimezoneMetadata,
    UserMetadata
} from "@skedulo/mex-engine-proxy"


const { MexResourcesModule } = NativeModules;

type AssetsResource = {
    jsonDef: UIDefinition,
    formData: any,
    sharedData: any
}

class AssetsManager implements IAssetsManager {

    cachedPackageId: string | null = null
    cachedFormName: string | null = null
    cachedContextId: string | null = null
    cachedStaticResourcesId: string | null = null
    cachedCustomFunction: string | null = null
    instanceDataChangedCallbacks: any[] = []
    cachedToken: string | null= null
    cachedAPIUrl: string | null = null

    originalInstanceData?: any

    metadata?: Metadatacontext

    resources: AssetsResource =  {
        jsonDef: { firstPage: "", pages: [], readonly: false },
        formData: {},
        sharedData: {}
    }

    dependencies: { utils: InternalUtilsType; } | undefined;

    initialize(
        { packageId, formName, contextId, staticResourcesId }: { packageId:string, formName: string, contextId: string, staticResourcesId: string },
        dependencies: {utils: InternalUtilsType}):void {

        this.dependencies = dependencies
        this.cachedPackageId = packageId
        this.cachedFormName = formName
        this.cachedContextId = contextId
        this.cachedStaticResourcesId = staticResourcesId

        this.printInfoOnDevEnv("packageId", packageId)
        this.printInfoOnDevEnv("contextId", contextId)
        this.printInfoOnDevEnv("staticResourcesId", staticResourcesId)

        this.metadata = {
            contextObjectId: contextId,
            packageId: packageId
        }

        // TODO: new instance data came, but ignore for now since it's making a lot issues, enable this later when find appropriate solutions
        // const eventEmitter = new NativeEventEmitter(NativeModules.ReactNativeEventEmitter)

        // Register instance data changed
        // eventEmitter.addListener("instanceDataChanged", () => {
        //     this.loadInstanceDataAsync().then(instanceData => {
        //         // Bind instance data
        //         this.resources.formData = makeAutoObservable(instanceData)
        //
        //         this.originalInstanceData = lodash.cloneDeep(instanceData)
        //
        //         // Notify callback to render UI
        //         this.instanceDataChangedCallbacks.forEach(c => c(instanceData))
        //     })
        // })

        LogManager.trackEvent('Open', this.getCommonAnalyticsProperties())
    }

    /**
     *
     * @return Promise
     */
    loadFormJsonDefResourcesAsync(): any {
        if (GlobalConfiguration.canUseDevelopmentConfig(DevelopmentModeConfigEnum.UseLocalUIDefinition)) {
            return Promise.resolve(GlobalConfiguration.getDevelopmentFormConfig().UiDef());
        } else {
            return MexResourcesModule.getFormJsonDefResources(this.cachedPackageId)
                .then((result:string) => {
                    return JSON.parse(result)[0]
                });
        }
    }

    getCommonAnalyticsProperties(): any {
        return {
            contextObjectId: this.cachedContextId,
            packageId: this.cachedPackageId,
        }
    }

    async loadInstanceDataAsync(): Promise<any> {
        let instanceData:any;

        let draftInstanceData = await DraftManager.getDraft(DraftManager.keys.instanceDataDraftKey())

        if (draftInstanceData != null) {
            return draftInstanceData
        }

        if (GlobalConfiguration.canUseDevelopmentConfig(DevelopmentModeConfigEnum.UseLocalInstanceData)) {
            instanceData = GlobalConfiguration.getDevelopmentFormConfig().FormData();
        } else {
            let instanceDataStr = await MexResourcesModule.getFormData(this.cachedPackageId, this.cachedContextId);

            instanceData = JSON.parse(instanceDataStr);
        }

        return instanceData;
    }

    loadStaticData(): Promise<any> {
        if (GlobalConfiguration.canUseDevelopmentConfig(DevelopmentModeConfigEnum.UseLocalStaticData)) {
            let staticDataFun = GlobalConfiguration.getDevelopmentFormConfig().StaticData;

            if (staticDataFun) {
                return Promise.resolve(staticDataFun())
            }
        }

        return MexResourcesModule.getFormSharedData(this.cachedPackageId)
            .then((dataStr: string) => {
                return JSON.parse(dataStr)
            });
    }

    loadUserMetadataAsync(): Promise<UserMetadata> {
        return MexResourcesModule.getResourceData()
            .then((dataStr: string) => {
                return JSON.parse(dataStr)
            });
    }

    loadFormMetadata(): Promise<any> {
        if (GlobalConfiguration.canUseDevelopmentConfig(DevelopmentModeConfigEnum.UseLocalFormMetadata)) {
            return Promise.resolve(GlobalConfiguration.getDevelopmentFormConfig().FormMetadata());
        }

        return MexResourcesModule.getFormMetaData(this.cachedPackageId)
            .then((dataStr: string) => {
                return JSON.parse(dataStr)
            });
    }

    loadOrgPreferencesAsync(): Promise<OrgPreferences> {
        return Promise.resolve({})

        return MexResourcesModule.getOrgPreferences()
            .then((dataStr: string) => {
                return JSON.parse(dataStr)
            });
    }

    loadTimezones(): Promise<any> {
        return MexResourcesModule.getTimezones(this.cachedContextId)
            .then((dataStr: string) => {
                return JSON.parse(dataStr) as TimezoneMetadata
            });
    }


    loadCustomFunctionAsync(): Promise<string> {
        if (GlobalConfiguration.canUseDevelopmentConfig(DevelopmentModeConfigEnum.UseLocalCustomFunctions)) {
            return Promise.resolve(custom_function);
        } else{
            return MexResourcesModule.getCustomFunction(this.cachedPackageId).then((customFunction: any) => {
                this.cachedCustomFunction = customFunction

                return customFunction
            })
        }
    }

    /**
     *
     * @return Promise
     */
    loadMexData(): Promise<AssetsResource> {
        let jsonDefTask = this.loadFormJsonDefResourcesAsync()
            .then((jsonDef: any) => {
                this.validateAndBindData(jsonDef, "UI Definition",
                    () => {
                        this.resources.jsonDef = jsonDef
                    })
            });
        let formDataTask = this.loadInstanceDataAsync()
            .then((formData: any) => {
                this.validateAndBindData(formData, "Form Data",
                    () => {
                        this.resources.formData = makeAutoObservable(lodash.cloneDeep(formData))
                        this.originalInstanceData = lodash.cloneDeep(formData)
                    })
            })
        let sharedDataTask = this.loadStaticData()
            .then((formSharedData:any) => {
                this.validateAndBindData(formSharedData, "Shared Data",
                    () => {
                        this.resources.sharedData = formSharedData
                    })
            })

        let customFunctionTask = this.loadCustomFunctionAsync()
            .then((customFunction:string) => this.cachedCustomFunction = customFunction)

        let loadUserMetadataTask = this.loadUserMetadataAsync()
            .then((userMetadata:UserMetadata) => {
                this.validateAndBindData(userMetadata, "User Metadata", () => {
                    this.metadata!.userMetadata = userMetadata
                })
            })

        const loadFormMetadataTask = this.loadFormMetadata()
            .then((formMetadata: FormMetadata) => {
                this.validateAndBindData(formMetadata, "Form Metadata", () => {
                    this.metadata!.formMetadata = formMetadata
                })
            })

        const loadTimezones = this.loadTimezones()
            .then(timezones => {
                this.metadata!.timezones = timezones
            })

        const loadOrgPreferencesTask = this.loadOrgPreferencesAsync()
            .then((orgPreferences: OrgPreferences) => {
                this.validateAndBindData(orgPreferences, "Org Preferences", () => {
                    this.metadata!.orgPreferences = orgPreferences
                })
            })

        return Promise.all([
            jsonDefTask,
            formDataTask,
            sharedDataTask,
            customFunctionTask,
            loadUserMetadataTask,
            loadFormMetadataTask,
            loadTimezones,
            loadOrgPreferencesTask
        ])
            .then((_) => {
                return this.resources
            });
    }

    validateAndBindData(data:any, key:string, action: ()=>void) {
        if (!data || data == "") {
            throw "Something when wrong when loading data for " + key
        }

        action();
    }

    printInfoOnDevEnv(message?: any, ...optionalParams: any[]) {
        if (__DEV__) {
            console.log(message, optionalParams)
        }
    }

    getResources() {
        return this.resources
    }

    getInstanceData() {
        return this.resources.formData
    }

    getCustomFunction(): string|null {
        return this.cachedCustomFunction;
    }

    async handleIsCompletedFormStatus() {
        const metadata = this.getMetadata()
        const isCompleted = !!this.dependencies?.utils.data.getMandatoryExpressionValue(
            metadata.formMetadata?.mandatoryExpression,
            this.getFormDataContext()
        )

        await MexResourcesModule.sendExtensionMandatoryStatus(metadata.packageId, metadata.contextObjectId, isCompleted)
    }

    async sync(forceSync: boolean): Promise<boolean> {
        let instanceData = lodash.cloneDeep(this.resources.formData);
        let instanceDataStr = JSON.stringify(instanceData)
        let originalInstanceDataStr = JSON.stringify(this.originalInstanceData)

        if (!forceSync && instanceDataStr == originalInstanceDataStr) {
            // Two object are exactly the same, no point to sync again
            // save isCompleted state
            await this.handleIsCompletedFormStatus()
            return true
        }

        return MexResourcesModule.sync(this.cachedPackageId, this.cachedContextId, instanceDataStr).then(async () => {
            await DraftManager.removeDraft(DraftManager.keys.instanceDataDraftKey())

            // save isCompleted state
            await this.handleIsCompletedFormStatus()

            await LogManager.trackEvent('Sync', this.getCommonAnalyticsProperties())

            return true
        })
    }

    registerInstanceDataCallChangedCallback(callback: any) {
        this.instanceDataChangedCallbacks.push(callback)
    }

    removeInstanceDataCallChangedCallback(callback: any) {
        let index = this.instanceDataChangedCallbacks.indexOf(callback)

        if (index !== -1) {
            this.instanceDataChangedCallbacks = this.instanceDataChangedCallbacks.slice(index, 1)
        }
    }

    getPageLevelData(route: any): PageLevelDataContext {
        return {
            pageData: route ? lodash.cloneDeep(route.params.pageData) : undefined, /* Page Data for each page always a standalone data */
            formData: this.resources.formData,
            sharedData: this.resources.sharedData,
            metadata: this.getMetadata()
        };
    }

    getFormDataContext() {
        return {
            formData: this.resources.formData,
            sharedData: this.resources.sharedData,
            metadata: this.getMetadata()
        }
    }

    getMetadata(): Metadatacontext {
        return this.metadata!
    }

    getAccessToken(): Promise<string> {

        if (this.cachedToken) {
            return Promise.resolve(this.cachedToken)
        }

        return MexResourcesModule.getAuthenticationToken()
            .then((token: string) => {
                this.cachedToken = token

                return this.cachedToken
            })
    }

    getAPIUrl(): Promise<string> {

        if (this.cachedAPIUrl) {
            return Promise.resolve(this.cachedAPIUrl)
        }

        return MexResourcesModule.getBaseUrl()
            .then((baseUrl: string) => {
                this.cachedAPIUrl = baseUrl

                return this.cachedAPIUrl
            })
    }

    dispose() {
        this.instanceDataChangedCallbacks = []
    }
}

export default new AssetsManager() as AssetsManager
