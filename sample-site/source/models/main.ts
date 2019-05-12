import 'knockout'

export class Main {
	public readonly value = ko.observable('hello')
	public readonly doThing = () => {
		this.value('goodbye')
	}
}
