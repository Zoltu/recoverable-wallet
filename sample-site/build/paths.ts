import * as path from 'path'

// const thisDirectoryPath = path.join(path.dirname(decodeURI(new URL(import.meta.url).pathname.substring(1))))
export const thisDirectoryPath = __dirname
export const projectRootPath = path.normalize(path.join(thisDirectoryPath, '..'))
export const tsconfigPath = path.join(projectRootPath, 'tsconfig.json')
export const inputDirectoryPath = path.join(projectRootPath, 'source')
export const outputDirectoryPath = path.join(projectRootPath, 'output')
export const nodeModuleDirectoryPath = path.join(projectRootPath, 'node_modules')
export const vendorDirectoryPath = path.join(outputDirectoryPath, 'vendor')
export const knockoutOutputDirectoryPath = path.join(vendorDirectoryPath, 'knockout')
export const esModuleShimsOutputDirectoryPath = path.join(vendorDirectoryPath, 'es-module-shims')

export const vendorMapping: { [key: string]: string } = {
	'knockout': path.join(nodeModuleDirectoryPath, 'knockout', 'build', 'output'),
	'es-module-shims': path.join(nodeModuleDirectoryPath, 'es-module-shims', 'dist'),
}
