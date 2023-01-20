import { Signal, useSignal } from '@preact/signals'
import { HexAddress, HexData } from '../library/types.js'
import { TOKENS } from '../library/tokens.js'
import { TokenAndAmount } from './TokenAndAmount.js'
import { AddressPicker } from './AddressPicker.js'
import { fromChecksummedAddress } from '../library/ethereum.js'
import { useAsyncState } from '../library/preact-utilities.js'
import { sleep } from '../library/utilities.js'
import { Spinner } from './Spinner.js'

// const quoter = fromChecksummedAddress('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6')
const swapRouter = fromChecksummedAddress('0xE592427A0AEce92De3Edee1F18E0157C05861564')

export interface UniswapAndSendModel {
	readonly userAddress: Signal<string>,
	readonly proposeTransaction: (to: HexAddress, data: HexData, value: bigint) => Promise<void>,
}
export function UniswapAndSend(model: UniswapAndSendModel) {
	const sourceToken = useSignal<TOKENS>('WETH')
	const sourceAmount = useSignal<bigint>(0n)
	const [ sourceAmountResult, querySourceAmount, _resetSourceAmount ] = useAsyncState()
	const recipient = useSignal<string>('')
	const targetToken = useSignal<TOKENS>('WETH')
	const targetAmount = useSignal<bigint>(0n)
	const [ targetAmountResult, queryTargetAmount, _resetTargetAmount ] = useAsyncState()

	function onSend() {
		// TODO: create the router swap transaction payload
		console.log(`Source Token: ${sourceToken}`)
		console.log(`Source Amount: ${sourceAmount}`)
		console.log(`Recipient: ${recipient}`)
		console.log(`Target Token: ${targetToken}`)
		console.log(`Target Amount: ${targetAmount}`)
		model.proposeTransaction(swapRouter, '0x', sourceToken.value === 'WETH' ? sourceAmount.value : 0n)
	}

	function sourceChanged() {
		if (sourceAmount.peek() === 0n) return
		queryTargetAmount(async function () {
			await sleep(1000)
			targetAmount.value = 5n
		})
	}

	function targetChanged() {
		if (targetAmount.peek() === 0n) return
		querySourceAmount(async function () {
			await sleep(1000)
			sourceAmount.value = 7n
		})
	}

	const SourceToken = (sourceAmountResult.state === 'pending') ? <Spinner/> : <TokenAndAmount key='source' token={sourceToken} amount={sourceAmount} onChange={sourceChanged}/>
	const TargetToken = (targetAmountResult.state === 'pending') ? <Spinner/> : <TokenAndAmount key='target' token={targetToken} amount={targetAmount} onChange={targetChanged}/>

	return <div>
		Send {SourceToken} to <AddressPicker address={recipient}/> as {TargetToken} <button onClick={onSend}>Send</button>
	</div>
}
