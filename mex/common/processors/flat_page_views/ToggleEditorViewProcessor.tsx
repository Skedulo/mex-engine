import * as React from "react";
import {Platform, Switch, Text, View} from "react-native";
import StylesManager from "../../../StylesManager";
import Expressions from "../../expression/Expressions";
import AbstractEditorViewProcessor, {EditorViewArgs, EditorViewProps} from "./AbstractEditorViewProcessors";
import {runInAction} from "mobx";
import {Attributes, FC} from "react";
import {observer} from "mobx-react";
import MexAsyncText from "../../../../components/MexAsyncText";
import ThemesManager from "../../../colors/ThemeManager";
import {RadioButton} from "../../../../components/RadioButton";
import {CheckBox} from "../../../../components/CheckBox";
import {ToggleEditorItemModel, ToggleEditorViewComponentModel} from "@skedulo/mex-types";

type ToggleEditorViewProps = EditorViewProps<ToggleEditorViewArgs, ToggleEditorViewComponentModel>

type ToggleEditorViewArgs = EditorViewArgs<ToggleEditorViewComponentModel> & {}

export default class ToggleEditorViewProcessor extends AbstractEditorViewProcessor<ToggleEditorViewProps, ToggleEditorViewArgs, ToggleEditorViewComponentModel> {

	getTypeName(): string {
		return "toggleEditor";
	}

	generateEditorComponent(args: ToggleEditorViewArgs): JSX.Element {
        const readonly = this.isComponentReadonly(args.jsonDef.readonly, args.dataContext)
        let renderItem = function (item: ToggleEditorItemModel, index: number) {
			if (args.jsonDef.mode == "switch") {
				return (
					<SwitchItem
						readonly={readonly}
						key={index}
						mode={ToggleMode.Switch}
						dataContext={args.dataContext}
						jsonDef={item}
					/>
				)
			} else {
				return (
					<View key={index++} style={{ marginTop: 24 }}>
						<CheckboxItem
							readonly={readonly}
							mode={args.jsonDef.mode === "radio" ? ToggleMode.Radio : ToggleMode.Checkbox}
							dataContext={args.dataContext}
							jsonDef={item}/>
					</View>
				)
			}
		}

		return (
			<View>
				{args.jsonDef.items.map(renderItem)}
			</View>)
	}
}

enum ToggleMode {
	Radio,
	Checkbox,
	Switch
}

interface ToggleItemProps extends Attributes {
	mode: ToggleMode
	dataContext: any,
	jsonDef: any,
    readonly: boolean
}

const SwitchItem = observer<FC<ToggleItemProps>>(args => {
	let colors = ThemesManager.getColorSet()
	let {dataContext, jsonDef, readonly = false} = args;

	let valueExpressionArgs = {dataContext: dataContext, expressionStr: jsonDef.valueExpression};

    let isEnabled = Expressions.getValueExpression(valueExpressionArgs);

	const toggleSwitch = () => {
		runInAction(() => {
			Expressions.setDataValueExpression(valueExpressionArgs, !isEnabled)
		})
	};

	const getThumbColor = () => {
        if (Platform.OS === 'ios') { // for IOS
            if (readonly) {
                return isEnabled ? colors.white : colors.navy100
            }
            return undefined
        }
        // for android
        if (readonly) {
            return isEnabled ? colors.navy100 : colors.navy50
        }
        return isEnabled ? colors.skedBlue800 : colors.white
    }

    const getTrackColor = () => {
        if (Platform.OS === 'ios') { // for IOS
            return {
                true: readonly ? colors.navy100 : colors.skedBlue800,
                false: colors.navy100
            }
        }
        // for android
        return {
            true: readonly ? colors.navy75 : colors.skedBlue200,
            false: colors.navy100
        }
    }

	return (
		<View style={{flexDirection: 'row', alignItems: 'center'}}>
			<MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
				expressionStr: args.jsonDef.text,
				dataContext: args.dataContext
			})}>
				{(text) => (
					<Text style={[
						StylesManager.getStyles().textRegular,
						{flex: 1}
					]}>{text}</Text>
				)}
			</MexAsyncText>
			<Switch
                disabled={readonly}
				trackColor={getTrackColor()}
				thumbColor={getThumbColor()}
				onValueChange={toggleSwitch}
				ios_backgroundColor={colors.white}
				value={isEnabled}/>
		</View>
	)
})

const CheckboxItem = observer<FC<ToggleItemProps>>(args => {
	let styleConst = StylesManager.getStyleConst()

	let {dataContext, jsonDef, readonly} = args;

	let valueExpressionArgs = {dataContext: dataContext, expressionStr: jsonDef.valueExpression};

    let value = Expressions.getValueExpression(valueExpressionArgs);

	let isRadio = args.mode === ToggleMode.Radio

	let onValue = jsonDef.onValue ?? true;
	let offValue = jsonDef.offValue ?? false;

	let isChecked = value === onValue;

	let handleOnPress = () => {
        if (readonly) { // if readonly mode on then do nothing
            return
        }
		if (isRadio && isChecked) {
			// If radio and tap again on the same control, ignore
			return;
		}

		isChecked = !isChecked

		runInAction(() => {
			Expressions.setDataValueExpression(valueExpressionArgs, isChecked ? onValue : offValue)
		})
	}

	let styles = StylesManager.getStyles()

	if (isRadio) {
		return (
			<RadioButton
				readonly={readonly}
				isChecked={isChecked}
				handleOnPress={handleOnPress}
				disableText={false}
				textComponent={
					(
						<MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
							expressionStr: args.jsonDef.text,
							dataContext: args.dataContext
						})}>
							{(text) => (
								<Text style={[
									styles.textRegular,
									{
										marginLeft: styleConst.betweenTextSpacing
									}
								]}>{text}</Text>
							)}
						</MexAsyncText>
					)
				}
			/>
		)
	}

	return (
		<CheckBox
			readonly={readonly}
			isChecked={isChecked}
			handleOnPress={handleOnPress}
			disableText={false}
			textComponent={
				(
					<MexAsyncText promiseFn={Expressions.generateGetValueFromLocalizationExpressionFunc({
						expressionStr: args.jsonDef.text,
						dataContext: args.dataContext
						})}
					>
						{(text) => (
							<Text style={[
								styles.textRegular,
								{
									marginLeft: styleConst.betweenTextSpacing
								}
							]}>{text}</Text>
						)}
					</MexAsyncText>
				)
			}
		/>
	)
})
