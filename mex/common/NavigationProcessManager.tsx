import * as RootNavigation from "./RootNavigation";
import {Routing, RoutingPageDef, RoutingType} from "@skedulo/mex-types";
import Expressions from "./expression/Expressions";
import {translateOneLevelOfExpression} from "./InternalUtils";
import {INavigationProcessManager, PageLevelDataContext} from "@skedulo/mex-engine-proxy";

export class NavigationContext {
    constructor() { }

    // This variable behaves as an additional instruction for upsert for letting the Form know where to add to the object to for the prevPageNavigationContext
    sourceExpression: string|undefined

    prevPageNavigationContext: NavigationContext|undefined

    currentDataContext:PageLevelDataContext|undefined
}

class NavigationProcessManager implements INavigationProcessManager {
    navigationMap = new Map();

    /**
     *
     * @param pageId
     * @return Promise
     */
    addTrack(pageId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.navigationMap.set(pageId, [resolve, reject])
        })
    }

    resolveTrack(pageId:string, value:any) {
        if (!this.navigationMap.has(pageId)) {
            return;
        }

        let [resolve, _] = this.navigationMap.get(pageId)

        resolve(value)

        this.navigationMap.delete(pageId)
    }

    async navigate(routing: RoutingType, pageData: any, navigationContext: NavigationContext|undefined = undefined, currentDataContext: any|undefined = undefined): Promise<any> {
        if (typeof(routing) === 'string' || routing instanceof String) {
            // Normal flow, just define as a string
            let pageId = routing as string

            RootNavigation.navigate(pageId, {pageData: pageData, navigationContext: navigationContext})

            return await this.addTrack(pageId)

        } else {
            // Normal flow, just define as a string
            routing = routing as RoutingPageDef

            let newDataContext = { ...currentDataContext }

            if (routing.ui) {
                // If UI is defined, start opening middleware page for allowing provide more data
                RootNavigation.navigate("routingModalScreen", {dataContext: currentDataContext, jsonDef: routing, navigationContext: navigationContext})

                let routingData = await this.addTrack("routingModalScreen")

                if (!routingData) {
                    // Do nothing, the user seem to cancel
                    return
                }

                newDataContext.routing = routingData
            }

            let route:Routing|undefined = undefined

            for (let i = 0; i < routing.routing.length; i++) {
                let eachRoute = routing.routing[i]

                if (!eachRoute.condition) {
                    route = eachRoute
                    break;
                }

                let isTrue = Expressions.getValueExpression({ expressionStr: eachRoute.condition, dataContext: newDataContext})

                if (isTrue) {
                    route = eachRoute
                    break;
                }
            }

            if (!route) {
                return;
            }

            if (pageData === undefined) {
                if (route.transferData) {
                    // We want to get the object directly, we don't want to flat it out in case user just want to directly pass entire pageData from prev page to this
                    pageData = translateOneLevelOfExpression({jsonDef: route.transferData, dataContext: newDataContext});
                }
            } else {
                pageData = {
                    ...pageData,
                    ...(!route.transferData ? {} : translateOneLevelOfExpression({jsonDef: route.transferData, dataContext: newDataContext}))
                }
            }

            RootNavigation.navigate(route.page, {pageData: pageData, navigationContext: navigationContext})

            return await this.addTrack(route.page)
        }
    }

    goBack(output?: any|undefined): void {

        let currentRouteName = RootNavigation.getCurrentRouteName();

        RootNavigation.goBack()

        this.resolveTrack(currentRouteName, output)
    }

}

export default new NavigationProcessManager() as NavigationProcessManager
