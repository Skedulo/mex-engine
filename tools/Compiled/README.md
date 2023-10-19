# Mex Build Tool

Mex Build Tools are mainly for the CMD tools around the Mex

## Migrate Engine from Develop to Staging/Prod
This tool is used to migrate a deployed engine version from Develop to Staging and Prod environment. This ensure that all the deployed engine with same version are actually having the same binary/file.

### Usage
In order to use this script, run as:
```
cd TO_ROOT_REPO
dotnet Tools/Compiled/MexBuildTool/MexMigrateTool.dll \
-m ${{ parameters.ENGINE_VERSION }} \
-e ${{ parameters.TARGET_ENVIRONMENT }} \
-d $(TENANT_ADMIN_DEV_TOKEN) \
-a ${{ parameters.ADMIN_TOKEN }} \
-o
```

- m: Engine Version
- e: Either "staging|prod" environment
- d: Develop Tenant admin token
- a: Console admin token
- o (Optional): Want to override the existed engine or not.

### How to edit the script

This script is written by using .NET Language, therefore the script in "Compiled" are the script that not editable (already compiled).
If one want to add/edit the behavior of this script, you will need to go to:

- Install Latest Visual Studio
- Open Tools/MexBuildTools/MexBuildTools.sln
- Start Working (of course you will need knowledge about .NET framework)

#### Deploy
- After finishing editing, you can deploy by right-clicking on the project in the solution explorer -> Publish.
- After publishing, copy all the files in publishing folder to Tools/Compiled/MexBuildTool/
