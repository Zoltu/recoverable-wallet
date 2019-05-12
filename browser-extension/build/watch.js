const path = require('path')
const FileCopier = require('@zoltu/file-copier').FileCopier
const watch = require('./compile-typescript').watch

// const thisDirectoryPath = path.join(path.dirname(decodeURI(new URL(import.meta.url).pathname.substring(1))))
const thisDirectoryPath = __dirname
const projectRootPath = path.normalize(path.join(thisDirectoryPath, '..'))
const tsconfigPath = path.join(projectRootPath, 'tsconfig.json')
const inputDirectoryPath = path.join(projectRootPath, 'source')
const outputDirectoryPath = path.join(projectRootPath, 'output')
const filterFunction = path => true

// kick off the file copier
new FileCopier(inputDirectoryPath, outputDirectoryPath, filterFunction)
// kick off the typescript watcher
watch(tsconfigPath)
