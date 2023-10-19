import * as React from "react";
import {
    Text,
    TouchableOpacity,
    View
} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import ThemeManager from "../../../colors/ThemeManager";
import NavigationProcessManager, {NavigationContext} from "../../NavigationProcessManager";
import MexAsyncText from "../../../../components/MexAsyncText";
import InternalUtils from "../../InternalUtils";
import SubListViewProcessorManager from "./sublist/SublistViewProcessorManager";
import SkedButton from "../../../../components/SkedButton";
import {SubListEditorViewComponentModel} from "@skedulo/mex-types";

type SubListEditorViewProps = EditorViewProps<SubListEditorViewArgs, SubListEditorViewComponentModel>

type SubListEditorViewArgs = EditorViewArgs<SubListEditorViewComponentModel> & {
}

export default class SubListEditorViewProcessor extends AbstractEditorViewProcessor<SubListEditorViewProps, SubListEditorViewArgs, SubListEditorViewComponentModel> {

    getTypeName(): string {
        return "subList";
    }

    override useTitle(): boolean {
        return false
    }

    generateEditorComponent(args: SubListEditorViewArgs): JSX.Element {
        var CurrentChildComponent: React.FC<any>

        let { jsonDef, dataContext } = args;

        let styles = StylesManager.getStyles()
        let styleConst = StylesManager.getStyleConst()
        let colors = ThemeManager.getColorSet()

        let source = Expressions.getRawDataValueExpression({dataContext: dataContext, expressionStr: jsonDef.sourceExpression}) ?? [];

        const renderItem = (item:any, key:string) => {

            if (!CurrentChildComponent){
                let processor = SubListViewProcessorManager.findProcessor(jsonDef.itemLayout.type);

                if (!processor) {
                    return (<Text>Not found for view type {jsonDef.itemLayout.type}</Text>)
                }

                CurrentChildComponent = processor.generateComponent()
            }

            const onItemPress = () => {
                if (!jsonDef.itemClickDestination)
                    return

                let pageData = item

                let navigationContext = new NavigationContext()

                navigationContext.sourceExpression = jsonDef.sourceExpression
                navigationContext.prevPageNavigationContext = args.navigationContext

                return NavigationProcessManager.navigate(
                    jsonDef.itemClickDestination,
                    pageData,
                    navigationContext,
    {
                        ...dataContext,
                        item
                    })
            }

            return (
                <TouchableOpacity
                    key={key}
                    onPress={onItemPress}>
                    <CurrentChildComponent args={{
                        jsonDef: jsonDef.itemLayout,
                        dataContext: {
                            ...dataContext,
                            item
                        }
                    }} />
                </TouchableOpacity>)
        };

        const renderEmptyLayout = () => {

            const getEmptyText = async (): Promise<string> => {
                let emptyText = Expressions.getValueFromLocalizedKey({expressionStr: jsonDef.emptyText, dataContext: args.dataContext})

                if (emptyText instanceof Promise) {
                    return await emptyText
                }

                return emptyText;
            }

            return (<MexAsyncText promiseFn={getEmptyText}>
                {(text) => (
                    <Text style={[
                        styles.textRegular, {
                            alignSelf: "center",
                            marginTop: 10,
                            color: colors.navy600
                        }]}>{text}</Text>)}
            </MexAsyncText>)

        }

        const renderHeaderLayout = () => {
            let renderAddNewButton = (): JSX.Element|null => {
                if (jsonDef.addNew) {
                    const getAddButtonText = async (): Promise<string> => {
                        let getAddButtonText = Expressions.getValueFromLocalizedKey({expressionStr: jsonDef.addNew.text, dataContext: args.dataContext})

                        if (getAddButtonText instanceof Promise) {
                            return await getAddButtonText
                        }

                        return getAddButtonText;
                    }

                    const onAddButtonClicked = async () => {
                        if (!jsonDef.addNew) {
                            return
                        }

                        let navigationContext = new NavigationContext()

                        navigationContext.sourceExpression = jsonDef.sourceExpression
                        navigationContext.prevPageNavigationContext = args.navigationContext

                        await NavigationProcessManager.navigate(
                            jsonDef.addNew.destinationPage,
                            InternalUtils.data.createTempObject(jsonDef.addNew.defaultData, dataContext),
                            navigationContext)
                    }

                    return (
                        <View style={{marginTop: styleConst.betweenTextSpacing}}>
                            <SkedButton
                                onPress={onAddButtonClicked}
                                key={"addNew"}
                                textPromiseFn={getAddButtonText} />
                        </View>
                    )
                } else {
                    return null
                }
            }

            const getTitle = async (): Promise<string> => {
                let title = Expressions.getValueFromLocalizedKey({expressionStr: args.jsonDef.title, dataContext: args.dataContext})

                if (title instanceof Promise) {
                    return await title
                }

                return title;
            }

            return (
                <View style={{ marginBottom: 10, alignItems: 'flex-start' }}>

                    <MexAsyncText promiseFn={getTitle}>
                        {(text) => (
                            <Text style={[styles.textHeadingBold, {flex: 1}]}>{text}</Text>)}
                    </MexAsyncText>

                    {renderAddNewButton()}
                </View>)
        }

        return (
            <View>
                {renderHeaderLayout()}

                {source.length > 0
                    ? source.map((item:any) => renderItem(item, item.UID))
                    : renderEmptyLayout()}
            </View>)
    }
}
