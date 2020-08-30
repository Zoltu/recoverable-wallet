declare module '@ledgerhq/hw-transport-node-hid-singleton' {
	import TransportNodeHidNoEvents, { getDevices } from '@ledgerhq/hw-transport-node-hid-noevents'
	export default class TransportNodeHid extends TransportNodeHidNoEvents {

	}
}
