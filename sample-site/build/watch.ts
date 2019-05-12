import { FileCopier } from '@zoltu/file-copier'
import * as paths from './paths'
import { watch } from './compile-typescript'
import * as path from 'path'

const filterFunction = () => true

// kick off the file copier
new FileCopier(paths.inputDirectoryPath, paths.outputDirectoryPath, filterFunction)
for (let vendor in paths.vendorMapping) {
	new FileCopier(paths.vendorMapping[vendor], path.join(paths.vendorDirectoryPath, vendor), filterFunction)
}
// kick off the typescript watcher
watch(paths.tsconfigPath)
