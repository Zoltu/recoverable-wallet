import { Signal } from "@preact/signals"

export interface AddressPickerModel {
	readonly address: Signal<string>
}
export function AddressPicker(model: AddressPickerModel) {
	function onChange(event: {target: EventTarget | null}) {
		if (!(event.target instanceof HTMLInputElement)) return
		model.address.value = event.target.value
	}
	return <input value={model.address} onChange={onChange} placeholder='0x0000000000000000000000000000000000000000'/>
}
