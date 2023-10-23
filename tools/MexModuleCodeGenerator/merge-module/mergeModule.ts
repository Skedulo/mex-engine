import task = require('azure-pipelines-task-lib/task');
import fs = require('fs');
import fse = require('fs-extra');
import {Project} from "ts-morph";

let argv = require('minimist')(process.argv.slice(2));

async function run() {
    try {
        let moduleFolder = argv['moduleFolder']
        let runningRootFolder = argv['rootFolder'] ?? "."

        console.log("Module folder path", moduleFolder)

        let modulesConfig = JSON.parse(fs.readFileSync(moduleFolder + "/modules_config.json", 'utf-8'))
        let modulesInfo:{ name: string, destinationFolderPath: string }[] = []

        let engineFolder = runningRootFolder + "/mex/modules/"

        try {
            fs.mkdirSync(engineFolder)
        } catch (e) {}

        for(let moduleFolderName in modulesConfig) {
            console.log("---", "Processing ", moduleFolderName, "----")

            console.log("moduleFolderName", moduleFolderName)

            // First we need to move the source code folder of the module
            let srcFolderPath = `${moduleFolder}/${moduleFolderName}/src`;
            let destinationFolderPath = runningRootFolder + "/mex/modules/" + moduleFolderName

            copyCodes(srcFolderPath, destinationFolderPath)

            modulesInfo.push({name: moduleFolderName, destinationFolderPath: "./mex/modules/" + moduleFolderName})
        }

        await appendResolveModulesCode(modulesInfo, runningRootFolder)

    } catch (err) {
        task.setResult(task.TaskResult.Failed, err.message);
    }
}

async function appendResolveModulesCode(modulesInfo: { name: string, destinationFolderPath: string }[], runningRootFolder: string) {
    let project = new Project()
    project.addSourceFileAtPath(runningRootFolder + "/index.tsx")
    project.resolveSourceFileDependencies();

    let indexSourceFile = project.getSourceFile("index.tsx")

    const scanModulePagesFunc = indexSourceFile.getFunction("scanModulePages")
    scanModulePagesFunc.setBodyText(writer => {
        writer.writeLine("let result:CustomComponentRegistry[] = []")

        modulesInfo.forEach(module => {
            writer.writeLine(`let mainFunction${module.name} = (await import("${module.destinationFolderPath}/index")) as any`)
            writer.writeLine(`result.push(mainFunction${module.name}.default())`)
        })

        writer.writeLine("return result")
    })

    await project.save()
}


function copyCodes(srcFolderPath, destinationFolderPath) {
    let srcFolder = fs.readdirSync(srcFolderPath)

    if (srcFolder.length == 0) {
        task.setResult(task.TaskResult.Failed, "Source folder not exists " + srcFolderPath);
        return;
    }

    if (fs.existsSync(destinationFolderPath)) {
        fs.rmSync(destinationFolderPath, { recursive: true, force: true });
    }

    fs.mkdirSync(destinationFolderPath)

    fse.copySync(srcFolderPath, destinationFolderPath)
}

run();
