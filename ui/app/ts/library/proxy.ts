export function createOnChangeProxy<T extends object>(onChange: () => void, target: T): T {
	for (const key in target) {
		const item = target[key]
		if (!isMutableObject(item)) continue
		target[key] = createOnChangeProxy(onChange, item)
	}
	return new Proxy<T>(target, createProxyHandler(onChange))
}

function createProxyHandler<T extends object>(onChange: () => void): ProxyHandler<T> {
	return {
		set: (object, property, newValue): boolean => {
			(object as any)[property] = (typeof newValue === 'object' ? createOnChangeProxy(onChange, newValue) : newValue)
			onChange()
			return true
		}
	}
}

function isMutableObject(maybe: any): maybe is object {
	if (maybe === null) return false
	if (maybe instanceof Date) return false
	// TODO: filter out any other special cases we can find, where something identifies as an `object` but is effectively immutable for our use cases
	return typeof maybe === 'object'
}
