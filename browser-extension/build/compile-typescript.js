"use strict"

const typescript = require("typescript")
const filesystem = require("fs")
const path = require("path")
const process = require("process")

function reportDiagnostic(diagnostic) {
	let message = "Error"
	if (diagnostic.file) {
		const where = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
		message += ' ' + diagnostic.file.fileName + ' ' + where.line + ', ' + where.character + 1
	}
	message += ": " + typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
	console.log(message)
}

function readConfigFile(configFileName) {
	// Read config file
	const configFileText = filesystem.readFileSync(configFileName).toString()

	// Parse JSON, after removing comments. Just fancier JSON.parse
	const result = typescript.parseConfigFileTextToJson(configFileName, configFileText)
	const configObject = result.config
	if (!configObject) {
		reportDiagnostic([result.error])
		process.exit(1)
	}

	// Extract config infromation
	const configParseResult = typescript.parseJsonConfigFileContent(configObject, typescript.sys, path.dirname(configFileName))
	if (configParseResult.errors.length > 0) {
		reportDiagnostic(configParseResult.errors)
		process.exit(1)
	}
	return configParseResult
}

function watch(configFileName) {
	// Extract configuration from config file
	const config = readConfigFile(configFileName)

	// Watch
	const compilerHost = typescript.createWatchCompilerHost(config.fileNames, config.options, typescript.sys, undefined, reportDiagnostic)
	typescript.createWatchProgram(compilerHost)
}

module.exports.watch = watch
