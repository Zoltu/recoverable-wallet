import { Signal } from '@preact/signals'
import { JSX } from 'preact/jsx-runtime'

export interface SelectModel<T extends string> {
	readonly options: readonly T[]
	readonly selected: Signal<T>
	readonly onChange?: (newValue: T) => void
}

export function Select<T extends string>(model: SelectModel<T>) {
	const onChange = (event: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
		model.selected.value = (event.target! as unknown as {value: T}).value
		model.onChange && model.onChange(model.selected.value)
	}

	return <select value={model.selected} onChange={onChange}>
		{
			model.options.map(x => <option key={x} value={x}>{x}</option>)
		}
	</select>
}
