declare module '@ledgerhq/hw-transport-node-hid-noevents' {
	import Transport from '@ledgerhq/hw-transport'
	export default class TransportNodeHidNoEvents extends Transport<string> {}
	export function getDevices(): Array<unknown>
}
