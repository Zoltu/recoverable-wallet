import { render, createElement, ComponentChildren, Fragment } from 'preact'

export function Shadow({ children }: { children: ComponentChildren }) {
	return createElement('span', {
		ref: host => {
			if (host == null) return
			const shadowRoot = host.shadowRoot || host.attachShadow({mode: 'open'})
			Array.isArray(children)
				? render(Fragment({ children }), shadowRoot)
				: render(children, shadowRoot)
		}
	})
}
