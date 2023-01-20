import { batch, Signal, useSignal, useSignalEffect } from "@preact/signals"
import { useReducer } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"
import { bigintToDecimalString, decimalStringToBigint } from "../library/utilities.js"
import { AutosizingInput } from "./AutosizingInput.js"

const sanitizationRegexp = /[^\d\.]/g
const regexp = /^\d*\.?(?:\d+)?$/

export interface FixedPointInput {
	value: Signal<bigint>
	decimals: Signal<bigint>
	autoSize?: boolean
	className?: string | JSX.SignalLike<string | undefined>
	style?: string | JSX.CSSProperties | JSX.SignalLike<string | JSX.CSSProperties>
	type?: string | JSX.SignalLike<string>
	placeholder?: string | JSX.SignalLike<string>
	required?: boolean | JSX.SignalLike<boolean>
	onChange?: () => void
}
export function FixedPointInput(model: FixedPointInput) {
	const [, forceUpdate] = useReducer<number, undefined>(x => x + 1, 0)
	const internalValue = useSignal('')
	useSignalEffect(() => {
		// don't set internalValue if its contents already equal the value (e.g., '1.' === 1 === '1.0' or '' === '0' === '0.' === '.' === '.0')
		if (decimalStringToBigint(internalValue.value, model.decimals.value) === model.value.value) return
		internalValue.value = bigintToDecimalString(model.value.value, model.decimals.value)
	})
	useSignalEffect(() => { model.value.value = decimalStringToBigint(internalValue.value, model.decimals.value) })
	function onInput(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
		const newValue = event.currentTarget.value
		if (newValue === internalValue.value) return
		if (newValue === '') {
			batch(() => {
				model.value.value = 0n
				internalValue.value = ''
			})
		}
		const sanitized = newValue.replaceAll(sanitizationRegexp, '')
		if (regexp.test(sanitized)) {
			batch(() => {
				model.value.value = decimalStringToBigint(sanitized, model.decimals.value)
				internalValue.value = sanitized
			})
	   }
	   if (newValue !== internalValue.value) {
		   forceUpdate(undefined)
	   }
	}

	const properties = {
		pattern: regexp.source,
		value: internalValue,
		onInput: onInput,
		className: model.className,
		style: model.style,
		type: model.type,
		placeholder: model.placeholder,
		required: model.required,
		onChange: model.onChange,
	} as const
	return model.autoSize ? <AutosizingInput {...properties} /> : <input {...properties}/>
}
