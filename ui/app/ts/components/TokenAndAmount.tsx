import { Signal, useComputed } from '@preact/signals'
import { TOKENS, tokensByName } from '../library/tokens.js'
import { FixedPointInput } from './FixedPointInput.js'
import { TokenSelector } from './TokenSelector.js'

export interface TokenAndAmountModel {
	readonly token: Signal<TOKENS>
	readonly amount: Signal<bigint>
	readonly onAmountChange?: () => void
	readonly onTokenChange?: () => void
}
export function TokenAndAmount(model: TokenAndAmountModel) {
	const decimals = useComputed(() => tokensByName[model.token.value].decimals)
	return <span>
		<FixedPointInput autoSize required placeholder='1.23' value={model.amount} decimals={decimals} onChange={model.onAmountChange}/>
		&nbsp;
		<TokenSelector selectedToken={model.token} onChange={model.onTokenChange}/>
	</span>
}
