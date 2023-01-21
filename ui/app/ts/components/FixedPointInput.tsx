import { batch, Signal, useSignal, useSignalEffect } from '@preact/signals'
import { JSX } from 'preact/jsx-runtime'
import { bigintToDecimalString, decimalStringToBigint } from '../library/utilities.js'
import { AutosizingInput } from './AutosizingInput.js'

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
	onChange?: (newValue: bigint) => void
}
export function FixedPointInput(model: FixedPointInput) {
	const internalValue = useSignal('')
	useSignalEffect(() => {
		// don't set internalValue if its contents already equal the value (e.g., '1.' === 1 === '1.0' or '' === '0' === '0.' === '.' === '.0')
		if (decimalStringToBigint(internalValue.value, model.decimals.value) === model.value.value) return
		internalValue.value = bigintToDecimalString(model.value.value, model.decimals.value)
	})
	useSignalEffect(() => { model.value.value = decimalStringToBigint(internalValue.value, model.decimals.value) })
	function onInput(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
		const nativeValue = event.currentTarget.value
		if (nativeValue === internalValue.value) return
		const sanitized = nativeValue.replaceAll(sanitizationRegexp, '')
		if (sanitized === '') {
			batch(() => {
				model.value.value = 0n
				internalValue.value = ''
			})
		} else if (regexp.test(sanitized)) {
			batch(() => {
				model.value.value = decimalStringToBigint(sanitized, model.decimals.value)
				internalValue.value = sanitized
			})
		}
		// after sanitization the internal value may differ from the native value so we need to force the native value to match our internal value to the internal value
		event.currentTarget.value = internalValue.value
	}
	function onChange() {
		model.onChange && model.onChange(model.value.value)
	}

	const properties = {
		value: internalValue,
		pattern: regexp.source,
		onInput: onInput,
		onChange: onChange,
		...model.className ? {className: model.className} : {},
		...model.style ? {style: model.style} : {},
		...model.type ? {type: model.type} : {},
		...model.placeholder ? {placeholder: model.placeholder} : {},
		...model.required ? {required: model.required} : {},
	} as const
	return model.autoSize ? <AutosizingInput {...properties} /> : <input {...properties}/>
}
