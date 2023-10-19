import AssetsManager from "../assets/AssetsManager";

export default class CustomFunctionExecutor {

    functionMap: Map<string, (...args: any[]) => any> = new Map<string,  (...args: any[]) => any>()

    setup(functionName:string): void {
        let parts = functionName.split(".")

        // get only last part
        functionName = parts[parts.length-1]

        // @ts-ignore
        if (this.functionMap.has(functionName)) {
            return
        }

        this.functionMap.set(functionName, this.buildCustomFunction(functionName))
    }

    returnMappingObject(): any {
        let object:any = {}

        Array.from(this.functionMap.keys()).forEach(key => {
            object[key] = this.functionMap.get(key)
        })

        return object;
    }


    private buildCustomFunction(functionName: string) : (...args: any[]) => any {
        let customJs = AssetsManager.getCustomFunction();

        if (!customJs || customJs === "") {
            // Custom function does not exist, proceed
            throw new Error("Not found custom function")
        }

        return (...args: any[]) => {
            let argsArray: any[] = []
            let argsContext: any = {}

            for (let i = 0; i < args.length; i++) {
                let argName = "arg_" + i

                argsArray.push(argName)

                argsContext[argName] = args[i]
            }

            let argsStr = argsArray.join(', ')

            customJs += "\n" + `exportFns.${functionName}(${argsStr})`

            let result = this.evalInContext(customJs!, argsContext)

            return result;
        }
    }

    // @ts-ignore
    private evalInContext(js:string, context:any) {
        return eval('with(context) { ' + js + ' }');
    }

}
