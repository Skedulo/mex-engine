"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const task = require("azure-pipelines-task-lib/task");
const fs = require("fs");
const plist = require("plist");
const MAJOR = 'MAJOR';
const MINOR = 'MINOR';
const PATCH = 'PATCH';
const PRE_RELEASE = 'PRE_RELEASE';
const NUMBER_OF_COMMITS = 'NUMBER_OF_COMMITS';
const NUMBER_OF_COMMITS_SINCE_TAG = 'NUMBER_OF_COMMITS_SINCE_TAG';
var argv = require('minimist')(process.argv.slice(2));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let git = task.which('git', true);
            var args = ["describe", "--tags", "--abbrev=0"];
            let tagResult = task.execSync(git, args);
            if (tagResult.code !== 0) {
                if (tagResult.error != null) {
                    task.error(`${tagResult.error.name} ${tagResult.error.message}`);
                    task.error(tagResult.error.stack);
                }
                task.error('No tag found on this branch, please verify you have one in your remote repository.');
                process.exit(1);
            }
            task.debug(`Tag retreived: ${tagResult.stdout}`);
            var originalTag = tagResult.stdout;
            if (originalTag.includes('\n')) {
                originalTag = originalTag.split('\n')[0];
            }
            var tag = originalTag.toLowerCase();
            if (tag.includes('v')) {
                var tagSplitted = tag.split('v');
                tag = tagSplitted[1];
            }
            var versionsIndicator = tag.split('.');
            task.debug(versionsIndicator.toString());
            if (versionsIndicator.length > 2 && versionsIndicator[2].includes('-')) {
                const preSplit = versionsIndicator[2].split('-');
                // Replacing PATCH split with pre release tag split
                versionsIndicator[2] = preSplit[0];
                setVariableOrDefault(PRE_RELEASE, preSplit[1]);
            }
            else {
                // setting empty string a PRE_RELEASE
                task.setVariable(PRE_RELEASE, '');
            }
            let major = versionsIndicator[0];
            let minor = versionsIndicator[1];
            let patch = versionsIndicator[2];
            setVariableOrDefault(MAJOR, major);
            setVariableOrDefault(MINOR, minor);
            setVariableOrDefault(PATCH, patch);
            task.debug('Get the number of commit until this tag');
            var args = ["rev-list", "--count", "HEAD"];
            let result = task.execSync(git, args);
            var numberOfCommits = result.stdout.split('\n');
            setVariableOrDefault(NUMBER_OF_COMMITS, numberOfCommits[0]);
            var argsSinceTag = ["rev-list", `${originalTag}..HEAD`, "--count"];
            let commitsSinceTagResult = task.execSync(git, argsSinceTag);
            var numberOfCommitsSinceTag = commitsSinceTagResult.stdout.split('\n');
            setVariableOrDefault(NUMBER_OF_COMMITS_SINCE_TAG, numberOfCommitsSinceTag[0]);
            task.debug(`Major:` + task.getVariable(MAJOR));
            task.debug(`Minor:` + task.getVariable(MINOR));
            task.debug(`Patch:` + task.getVariable(PATCH));
            if (task.getVariable(PRE_RELEASE)) {
                task.debug(`Pre Release:` + task.getVariable(PRE_RELEASE));
            }
            task.debug(`Number of commits:` + task.getVariable(NUMBER_OF_COMMITS));
            task.debug(`Number of commits since tag:` + task.getVariable(NUMBER_OF_COMMITS_SINCE_TAG));
            task.setResult(task.TaskResult.Succeeded, "Extract version from tag succeeded");
            let versionName = `${major}.${minor}.${patch}`;
            let buildNumber = (27000 + parseInt(numberOfCommits[0])).toString(); /* 30_0000 is the number that we used to deploy old version before, fo we have to continue with the version upper then 30000 */
            task.debug(`versionName ${versionName}`);
            task.debug(`buildNumber ${buildNumber}`);
            if (argv['infoPlistPath']) {
                changeIOSVersion(buildNumber, versionName);
            }
            if (argv['buildGradlePath']) {
                changeAndroidVersion(buildNumber, versionName);
            }
            console.log(`versionName ${versionName}`);
            console.log(`buildNumber ${buildNumber}`);
        }
        catch (err) {
            task.setResult(task.TaskResult.Failed, err.message);
        }
    });
}
function changeIOSVersion(buildVersion, versionName) {
    var infoPlistPath = argv['infoPlistPath'];
    task.debug(`versionName ${versionName}`);
    task.debug(`buildNumber ${buildVersion}`);
    if (!fs.existsSync(infoPlistPath)) {
        task.error(`The file path for the info.plist does not exist or is not found: ${infoPlistPath}`);
        process.exit(1);
    }
    if (!versionName) {
        task.error(`versionName String has no value: ${versionName}.`);
        process.exit(1);
    }
    if (!buildVersion) {
        task.error(`buildVersion has no value: ${buildVersion}`);
        process.exit(1);
    }
    var fileContent = fs.readFileSync(infoPlistPath, { encoding: "utf-8" });
    task.debug(JSON.stringify(fileContent));
    var obj = plist.parse(fileContent);
    obj['CFBundleShortVersionString'] = versionName;
    obj['CFBundleVersion'] = buildVersion;
    fs.chmodSync(infoPlistPath, "600");
    fs.writeFileSync(infoPlistPath, plist.build(obj));
    task.setResult(task.TaskResult.Succeeded, `Info.plist updated successfully with CFBundleShortVersionString: ${versionName} and CFBundleVersion: ${buildVersion}`);
}
function changeAndroidVersion(buildVersion, versionName) {
    var buildGradlePath = argv['buildGradlePath'];
    if (!fs.existsSync(buildGradlePath)) {
        task.error(`The file path for the build.gradle does not exist or is not found: ${buildGradlePath}`);
        process.exit(1);
    }
    task.debug(`Running task with ${buildGradlePath}`);
    task.debug(`VersionCode: ${buildVersion}`);
    if (buildVersion == null) {
        task.error(`Version Code has no value: ${buildVersion}`);
        process.exit(1);
    }
    else if (parseInt(buildVersion, 0) <= 0 && parseInt(buildVersion, 10) >= 2100000000) {
        task.error(`The Version Code you set: ${buildVersion} is not valid, to submit your application to the Google Play Store the value must 
            be greater then 0 and below 2100000000 of ${buildVersion}`);
        process.exit(1);
    }
    task.debug(`VersionName: ${versionName}`);
    var filecontent = fs.readFileSync(buildGradlePath).toString();
    fs.chmodSync(buildGradlePath, "600");
    filecontent = filecontent.replace(/androidVersionCode =\s*(\d+(?:\.\d)*)/mg, `androidVersionCode = ${buildVersion}`);
    filecontent = filecontent.replace(/androidVersionName =\s"\s*(\d+(?:\.\d+)*)"/mg, `androidVersionName = \"${versionName}\"`);
    fs.writeFileSync(buildGradlePath, filecontent);
    task.setResult(task.TaskResult.Succeeded, `build.gradle updated successfully with  versionCode: ${buildVersion} and versionName: ${versionName}. Please, define it manually or use the ExtractVersionFromTagTask before to automatically set it.`);
}
function setVariableOrDefault(name, value, defaultValue = '0') {
    if (value) {
        task.setVariable(name, value);
    }
    else {
        task.setVariable(name, defaultValue);
    }
}
run();
