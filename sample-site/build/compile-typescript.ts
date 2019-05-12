import * as typescript from 'typescript'
import * as filesystem from 'fs'
import * as path from 'path'
import * as process from 'process'

function reportDiagnostic(diagnostic: typescript.Diagnostic) {
	let message = "Error"
	if (diagnostic.file && diagnostic.start) {
		const where = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
		message += ' ' + diagnostic.file.fileName + ' ' + where.line + ', ' + where.character + 1
	}
	message += ": " + typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
	console.log(message)
}

function readConfigFile(configFileName: string) {
	// Read config file
	const configFileText = filesystem.readFileSync(configFileName).toString()

	// Parse JSON, after removing comments. Just fancier JSON.parse
	const result = typescript.parseConfigFileTextToJson(configFileName, configFileText)
	const configObject = result.config
	if (!configObject) {
		if (result.error) reportDiagnostic(result.error)
		else console.error(`Invalid result:\n${JSON.stringify(result)}`)
		process.exit(1)
	}

	// Extract config infromation
	const configParseResult = typescript.parseJsonConfigFileContent(configObject, typescript.sys, path.dirname(configFileName))
	if (configParseResult.errors.length > 0) {
		configParseResult.errors.forEach(reportDiagnostic)
		process.exit(1)
	}
	return configParseResult
}

export function watch(configFileName: string) {
	// Extract configuration from config file
	const config = readConfigFile(configFileName)

	// Watch
	const compilerHost = typescript.createWatchCompilerHost(config.fileNames, config.options, typescript.sys, undefined, reportDiagnostic)
	typescript.createWatchProgram(compilerHost)
}

export function compile(configFileName: string) {
	const config = readConfigFile(configFileName)

	const program = typescript.createProgram(config.fileNames, config.options)
	const emitResult = program.emit()

	typescript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics).forEach(reportDiagnostic)

	const exitCode = emitResult.emitSkipped ? 1 : 0
	process.exit(exitCode)
}
