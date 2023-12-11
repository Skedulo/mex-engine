import * as RNLocalize from "react-native-localize";
import memoize from "lodash.memoize";
import AssetsManager from "./AssetsManager";
import {ReadDirItem} from "react-native-fs";
import GlobalConfigurations, {DevelopmentModeConfigEnum} from "../GlobalConfiguration";
import i18n from "i18n-js";
import GlobalConfiguration from "../GlobalConfiguration";

let RNFS = require('react-native-fs');

const defaultLocalizationFiles: any = {
    // lazy requires (metro bundler does not support symlinks)
    en: () => require("../assets/default_localization/en.json"),
    es: () => require("../assets/default_localization/es.json")
};

let translate = memoize(
    (key, config?) => i18n.t(key, config),
    (key, config) => (config ? key + JSON.stringify(config) : key),
);


class LocalizationManager {

    async initializeLocalization(): Promise<boolean> {
        // fallback if no available language fits
        const fallback = {languageTag: "en", isRTL: false};

        // clear translation cache
        translate.cache.clear?.();

        let languageTags: string[]
        let localizedContent : { [id: string] : any }

        if (GlobalConfigurations.canUseDevelopmentConfig(DevelopmentModeConfigEnum.UseLocalTranslationFiles)) {
            [languageTags, localizedContent] = this.loadFromLocalResources()
        }
        else {
            [languageTags, localizedContent] = await this.loadFromRemoteResources()
        }

        let {languageTag} =
            RNLocalize.findBestAvailableLanguage(languageTags) ||
            fallback;

        if (languageTag.includes("-")){
            languageTag = languageTag.split('-')[0]
        }

        i18n.locale = languageTag;
        i18n.translations = localizedContent

        return true;
    };

    async loadFromRemoteResources(): Promise<[string[], { [id: string] : any }]> {

        let storePromises: Promise<boolean>[] = []
        let languageTags: string[] = [];
        let results:ReadDirItem[] = await RNFS.readDir(`${RNFS.DocumentDirectoryPath}/mex/resources/${AssetsManager.cachedStaticResourcesId}/locales`);

        let localizationGetter: { [id: string] : any } = {}

        results.forEach(file => {
            let tag = file.name.replace('.json', '')

            languageTags.push(tag)

            let storePromise = RNFS.readFile(file.path)
                .then((fileContent: string) => {
                    let localizedContent = JSON.parse(fileContent)

                    if (defaultLocalizationFiles[tag]) {
                        localizedContent = { ...defaultLocalizationFiles[tag](), ...localizedContent }
                    }

                    localizationGetter[tag] = localizedContent;

                    return true
                });

            storePromises.push(storePromise)
        })

        await Promise.all(storePromises)

        return [languageTags, localizationGetter];
    }

    loadFromLocalResources(): [string[], { [id: string] : any }] {
        let tags: string[] = []
        let localizationGetter: { [id: string] : any } = {}

        const localLocalizationFiles: { [id: string] : () => any; } = { }
        GlobalConfiguration.getDevelopmentFormConfig().Languages.forEach(value => {
            localLocalizationFiles[value.tag] = value.content
        })

        for (let tag in localLocalizationFiles) {

            tags.push(tag)

            let localizedContent = localLocalizationFiles[tag]()

            if (defaultLocalizationFiles[tag]) {
                localizedContent = { ...defaultLocalizationFiles[tag](), ...localizedContent }
            }

            localizationGetter[tag] = localizedContent
        }

        return [tags,localizationGetter]
    }
}

export default new LocalizationManager() as LocalizationManager

export { translate }
