import { createOnChangeProxy } from './library/proxy'
import { AppModel, App } from './components/App'

// create our root model as a proxy object that will auto-rerender anytime its properties (recursively) change
const rootModel: AppModel = createOnChangeProxy<AppModel>(render, {
	cycleGreeting: () => rootModel.greeting = (rootModel.greeting === 'Hello') ? 'nuqneH' : 'Hello',
	greeting: 'Hello',
	subject: 'Universe',
})

// put the root model on the window for debugging convenience
declare global { interface Window { rootModel: AppModel } }
window.rootModel = rootModel

// find the HTML element we will attach to
const main = document.querySelector('main')

// specify our render function, which will be fired anytime rootModel is mutated
function render() {
	const element = React.createElement(App, rootModel)
	ReactDOM.render(element, main)
}

// kick off the initial render
render()
