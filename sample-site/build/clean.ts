import { recursiveDirectoryDelete } from '@zoltu/file-copier'
import { outputDirectoryPath } from './paths'

const doStuff = async () => {
	await recursiveDirectoryDelete(outputDirectoryPath)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	debugger
	process.exit(1)
})
