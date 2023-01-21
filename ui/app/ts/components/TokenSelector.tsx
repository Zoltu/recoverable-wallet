import { Signal } from '@preact/signals'
import { tokenSymbols, TOKENS } from '../library/tokens.js'
import { Select } from './Select.js'

export type TokenSelectorModel = {
	readonly selectedToken: Signal<TOKENS>
	readonly onChange?: (newValue: TOKENS) => void
}

export function TokenSelector(model: TokenSelectorModel) {
	return <Select options={tokenSymbols} selected={model.selectedToken} onChange={model.onChange}/>
}
