import { useSignal } from '@preact/signals'
import { UniswapAndSend } from './UniswapAndSend.js'
import { HexAddress, HexData } from '../library/types.js'

export interface AppModel {
}

export function App(_model: AppModel) {
	const userAddress = useSignal<string>('')
	async function proposeTransaction(_to: HexAddress, _data: HexData, _value: bigint) {
	}
	return <main>
		<UniswapAndSend userAddress={userAddress} proposeTransaction={proposeTransaction}/>
	</main>
}
