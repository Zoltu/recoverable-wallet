import { JSX } from "preact/jsx-runtime"
import { useSignal, useSignalEffect } from "@preact/signals"

export interface InputModel extends Pick<JSX.HTMLAttributes<HTMLSpanElement>, 'className' | 'style'>, Pick<JSX.HTMLAttributes<HTMLInputElement>, 'type' | 'pattern' | 'placeholder' | 'required' | 'value'> {
	readonly value: JSX.SignalLike<string>
	readonly onInput?: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void
	readonly onChange?: (event: JSX.TargetedEvent<HTMLInputElement, Event>) => void
}
export function AutosizingInput(model: InputModel) {
	const value = useSignal('')
	const onInput = (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
		value.value = event.currentTarget.value
		model.onInput && model.onInput(event)
	}
	useSignalEffect(function() { value.value = model.value.value })

	return <span className={model.className} style={model.style}>
		<label data-value={value} className='input-sizer'>
			<input type={model.type} pattern={model.pattern} required={model.required} placeholder={model.placeholder} value={model.value} onInput={onInput} onChange={model.onChange} size={1}/>
		</label>
	</span>
}
