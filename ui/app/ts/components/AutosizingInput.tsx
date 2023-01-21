import { JSX } from 'preact/jsx-runtime'
import { useSignal, useSignalEffect } from '@preact/signals'
import { Shadow } from '../library/Shadow.js'

export interface AutosizingInputModel extends Pick<JSX.HTMLAttributes<HTMLSpanElement>, 'className' | 'style'>, Pick<JSX.HTMLAttributes<HTMLInputElement>, 'type' | 'pattern' | 'placeholder' | 'required' | 'value' | 'onInput' | 'onChange'> {
	readonly value: JSX.SignalLike<string>
}
export function AutosizingInput(model: AutosizingInputModel) {
	const value = useSignal('')
	const onInput = (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
		value.value = event.currentTarget.value
		// https://github.com/preactjs/preact/pull/3867
		model.onInput && (model as { onInput: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void }).onInput(event)
	}
	useSignalEffect(function() { value.value = model.value.value })

	return <Shadow>
		<span className={model.className} style={model.style}>
			<link rel='stylesheet' href='css/autosizing-input.css'/>
			<label data-value={value}>
				<input type={model.type} pattern={model.pattern} required={model.required} placeholder={model.placeholder} value={model.value} onChange={model.onChange} onInput={onInput} size={1}/>
			</label>
		</span>
	</Shadow>
}
