import { recursiveDirectoryCopy } from '@zoltu/file-copier'
import * as paths from './paths'
import * as path from 'path'
import { compile } from './compile-typescript';

const doStuff = async () => {
	await recursiveDirectoryCopy(paths.inputDirectoryPath, paths.outputDirectoryPath)
	for (let vendor in paths.vendorMapping) {
		await recursiveDirectoryCopy(paths.vendorMapping[vendor], path.join(paths.vendorDirectoryPath, vendor))
	}
	compile(paths.tsconfigPath)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	debugger
	process.exit(1)
})
