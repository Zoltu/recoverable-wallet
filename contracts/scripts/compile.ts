import { promises as filesystem } from 'fs'
import * as path from 'path'
import { AbiFunction, AbiEvent } from 'ethereum'
import { CompilerOutput, CompilerInput, compile, CompilerOutputContractFile, CompilerOutputContract } from 'solc'
import { generateContractInterfaces } from '@zoltu/solidity-typescript-generator'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { unsignedBigintToUint8Array } from '@zoltu/bigint-helpers'

export async function ensureDirectoryExists(absoluteDirectoryPath: string) {
	try {
		await filesystem.mkdir(absoluteDirectoryPath)
	} catch (error) {
		if (error.code === 'EEXIST') return
		throw error
	}
}

async function compileContracts(): Promise<[CompilerInput, CompilerOutput]> {
	const solidityFilePath = path.join(__dirname, '..', 'source', 'recoverable-wallet.sol')
	const soliditySourceCode = await filesystem.readFile(solidityFilePath, 'utf8')
	const compilerInput: CompilerInput = {
		language: "Solidity",
		settings: {
			optimizer: {
				enabled: true,
				runs: 500
			},
			outputSelection: {
				"*": {
					'*': [ 'abi', 'metadata', 'evm.bytecode.object', 'evm.bytecode.sourceMap', 'evm.deployedBytecode.object', 'evm.gasEstimates' ]
				}
			}
		},
		sources: {
			'recoverable-wallet.sol': {
				content: soliditySourceCode
			}
		}
	}
	const compilerInputJson = JSON.stringify(compilerInput)
	const compilerOutputJson = compile(compilerInputJson)
	const compilerOutput = JSON.parse(compilerOutputJson) as CompilerOutput
	const errors = compilerOutput.errors
	if (errors) {
		let concatenatedErrors = "";

		for (let error of errors) {
			concatenatedErrors += error.formattedMessage + "\n";
		}

		if (concatenatedErrors.length > 0) {
			throw new Error("The following errors/warnings were returned by solc:\n\n" + concatenatedErrors);
		}
	}

	return [compilerInput, compilerOutput]
}

async function writeCompilerInput(input: CompilerInput) {
	await ensureDirectoryExists(path.join(__dirname, '..', '/output/'))
	const filePath = path.join(__dirname, '..', 'output', 'recoverable-wallet-input.json')
	const fileContents = JSON.stringify(input, undefined, '\t')
	return await filesystem.writeFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
}

async function writeCompilerOutput(output: CompilerOutput) {
	await ensureDirectoryExists(path.join(__dirname, '..', '/output/'))
	const filePath = path.join(__dirname, '..', 'output', 'recoverable-wallet-output.json')
	const fileContents = JSON.stringify(output, undefined, '\t')
	return await filesystem.writeFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
}

async function writeJson(abi: (AbiFunction | AbiEvent)[]) {
	await ensureDirectoryExists(path.join(__dirname, '..', '/output/'))
	const filePath = path.join(__dirname, '..', 'output', 'recoverable-wallet-abi.json')
	const fileContents = JSON.stringify(abi, undefined, '\t')
	return await filesystem.writeFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
}

async function writeGeneratedInterface(compilerOutput: CompilerOutput) {
	const filePath = path.join(__dirname, '..', 'source', 'recoverable-wallet.ts')
	const fileContents = await generateContractInterfaces(compilerOutput)
	await filesystem.writeFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
}

async function writeBytecode(contracts: CompilerOutputContractFile) {
	for (let contractName in contracts) {
		const filePath = path.join(__dirname, '..', 'output', `${contractName}-bytecode.txt`)
		const fileContents = contracts[contractName].evm.bytecode.object
		await filesystem.writeFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
	}
}

async function writeDeploymentParameters(factoryCompilerOutput: CompilerOutputContract) {
	const factoryInitcodeAsString = factoryCompilerOutput.evm.bytecode.object
	const factoryBytecodeAsString = factoryCompilerOutput.evm.deployedBytecode!.object
	if (factoryInitcodeAsString.length === 0) throw new Error(`Factory has no bytecode.  This probably means it is an abstract contract.`)
	if (!/[a-fA-F0-9]+/.test(factoryInitcodeAsString)) throw new Error(`Factory bytecode is not a hex string.`)
	const deployerAddress = [0x7a, 0x0d, 0x94, 0xf5, 0x57, 0x92, 0xc4, 0x34, 0xd7, 0x4a, 0x40, 0x88, 0x3c, 0x6e, 0xd8, 0x54, 0x5e, 0x40, 0x6d, 0x12]
	const salt = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
	const initCode = factoryInitcodeAsString.match(/[0-9a-fA-F]{2}/gi)!.map(byte => Number.parseInt(byte, 16))
	const initCodeHash = await keccak256.hash(initCode)
	const address = await keccak256.hash([0xff, ...deployerAddress, ...salt, ...unsignedBigintToUint8Array(initCodeHash, 256)]) & 0xffffffffffffffffffffffffffffffffffffffffn
	const filePath = path.join(__dirname, '..', 'source', 'deployment-parameters.ts')
	const fileContents = `export const factoryAddress = 0x${address.toString(16)}n
export const factoryInitcode = '0x${factoryInitcodeAsString}'
export const factoryBytecode = '0x${factoryBytecodeAsString}'`
	await filesystem.writeFile(filePath, fileContents, { encoding: 'utf8', flag: 'w' })
}

async function doStuff() {
	const [compilerInput, compilerOutput] = await compileContracts()
	const contracts = compilerOutput.contracts['recoverable-wallet.sol']
	const factory = contracts['RecoverableWalletFactory']
	await writeCompilerInput(compilerInput)
	await writeCompilerOutput(compilerOutput)
	await writeJson(contracts.RecoverableWallet.abi)
	await writeGeneratedInterface(compilerOutput)
	await writeBytecode(contracts)
	await writeDeploymentParameters(factory)
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
