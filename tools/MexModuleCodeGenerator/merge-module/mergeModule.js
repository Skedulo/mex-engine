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
const fse = require("fs-extra");
const ts_morph_1 = require("ts-morph");
let argv = require('minimist')(process.argv.slice(2));
function run() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let moduleFolder = argv['moduleFolder'];
            let runningRootFolder = (_a = argv['rootFolder']) !== null && _a !== void 0 ? _a : ".";
            console.log("Module folder path", moduleFolder);
            let modulesConfig = JSON.parse(fs.readFileSync(moduleFolder + "/modules_config.json", 'utf-8'));
            let modulesInfo = [];
            let engineFolder = runningRootFolder + "/mex/modules/";
            try {
                fs.mkdirSync(engineFolder);
            }
            catch (e) { }
            for (let moduleFolderName in modulesConfig) {
                console.log("---", "Processing ", moduleFolderName, "----");
                console.log("moduleFolderName", moduleFolderName);
                // First we need to move the source code folder of the module
                let srcFolderPath = `${moduleFolder}/${moduleFolderName}`;
                let destinationFolderPath = runningRootFolder + "/mex/modules/" + moduleFolderName;
                copyCodes(srcFolderPath, destinationFolderPath);
                modulesInfo.push({ name: moduleFolderName, destinationFolderPath: "./mex/modules/" + moduleFolderName });
            }
            yield appendResolveModulesCode(modulesInfo, runningRootFolder);
        }
        catch (err) {
            task.setResult(task.TaskResult.Failed, err.message);
        }
    });
}
function appendResolveModulesCode(modulesInfo, runningRootFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        let project = new ts_morph_1.Project();
        project.addSourceFileAtPath(runningRootFolder + "/index.tsx");
        project.resolveSourceFileDependencies();
        let indexSourceFile = project.getSourceFile("index.tsx");
        const scanModulePagesFunc = indexSourceFile.getFunction("scanModulePages");
        scanModulePagesFunc.setBodyText(writer => {
            writer.writeLine("let result:CustomComponentRegistry[] = []");
            modulesInfo.forEach(module => {
                writer.writeLine(`let mainFunction${module.name} = (await import("${module.destinationFolderPath}/index")) as any`);
                writer.writeLine(`result.push(mainFunction${module.name}.default())`);
            });
            writer.writeLine("return result");
        });
        yield project.save();
    });
}
function copyCodes(srcFolderPath, destinationFolderPath) {
    let srcFolder = fs.readdirSync(srcFolderPath);
    if (srcFolder.length == 0) {
        task.setResult(task.TaskResult.Failed, "Source folder not exists " + srcFolderPath);
        return;
    }
    if (fs.existsSync(destinationFolderPath)) {
        fs.rmSync(destinationFolderPath, { recursive: true, force: true });
    }
    fs.mkdirSync(destinationFolderPath);
    fse.copySync(srcFolderPath, destinationFolderPath);
}
run();
