import org.ethereum.crypto.ECKey
import org.ethereum.solidity.compiler.CompilationResult
import org.ethereum.solidity.compiler.SolidityCompiler
import org.ethereum.util.blockchain.StandaloneBlockchain
import org.junit.Before
import org.junit.Test
import java.io.File
import java.math.BigInteger
import java.util.*
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class RecoverableWallet {
	companion object {
		val recoverableWalletContractMetadata by lazy {
			val compilerResult = SolidityCompiler.compile(File("contracts/recoverable-wallet.sol"), true, SolidityCompiler.Options.ABI, SolidityCompiler.Options.BIN, SolidityCompiler.Options.INTERFACE, SolidityCompiler.Options.METADATA)
			assertFalse(compilerResult.isFailed, compilerResult.errors)
			CompilationResult.parse(compilerResult.output).contracts.mapKeys { Regex("^.*:(.*)$").find(it.key)!!.groups[1]!!.value }["RecoverableWallet"]!!
		}
		val alice = ECKey()
		val bob = ECKey()
		val carol = ECKey()
		val dan = ECKey()
	}

	lateinit var blockchain: StandaloneBlockchain
	val aliceAddress get() = BigInteger(1, alice.address)
	val bobAddress get() = BigInteger(1, bob.address)

	@Before
	fun `setup`() {
		blockchain = StandaloneBlockchain().withAutoblock(true)
		blockchain.createBlock()
		blockchain.sendEther(alice.address, BigInteger.valueOf(2).pow(128))
		blockchain.sendEther(bob.address, BigInteger.valueOf(2).pow(128))
	}

	@Test
	fun `successful ownership transfer`() {
		blockchain.sender = alice
		val recoverableWallet = blockchain.submitNewContract(recoverableWalletContractMetadata)
		val originalOwner = recoverableWallet.callConstFunction("getOwner")[0] as ByteArray
		val originalPendingOwner = recoverableWallet.callConstFunction("getPendingOwner")[0] as ByteArray
		recoverableWallet.callFunction("transferOwnership", bobAddress)
		val postTransferOwner = recoverableWallet.callConstFunction("getOwner")[0] as ByteArray
		val postTransferPendingOwner = recoverableWallet.callConstFunction("getPendingOwner")[0] as ByteArray
		blockchain.sender = bob
		recoverableWallet.callFunction("claimOwnership")
		val finalOwner = recoverableWallet.callConstFunction("getOwner")[0] as ByteArray
		val finalPendingOwner = recoverableWallet.callConstFunction("getPendingOwner")[0] as ByteArray

		assertByteArraysEqual(expected = alice.address, actual = originalOwner)
		assertByteArraysEqual(expected = ByteArray(20, { 0 }), actual = originalPendingOwner)
		assertByteArraysEqual(expected = alice.address, actual = postTransferOwner)
		assertByteArraysEqual(expected = bob.address, actual = postTransferPendingOwner)
		assertByteArraysEqual(expected = bob.address, actual = finalOwner)
		assertByteArraysEqual(expected = ByteArray(20, { 0 }), actual = finalPendingOwner)
	}

	@Test
	fun `only owner can transfer ownership`() {
		blockchain.sender = alice
		val recoverableWallet = blockchain.submitNewContract(recoverableWalletContractMetadata)
		blockchain.sender = bob
		val result = recoverableWallet.callFunction("transferOwnership", bobAddress)
		assertFalse(result.isSuccessful)
	}

	@Test
	fun `only claimant can claim ownership`() {
		blockchain.sender = alice
		val recoverableWallet = blockchain.submitNewContract(recoverableWalletContractMetadata)
		recoverableWallet.callFunction("transferOwnership", bobAddress)
		val result = recoverableWallet.callFunction("claimOwnership")
		assertFalse(result.isSuccessful)
	}

	@Test
	fun `cannot set owner to 0`() {
		blockchain.sender = alice
		val recoverableWallet = blockchain.submitNewContract(recoverableWalletContractMetadata)
		val result = recoverableWallet.callFunction("transferOwnership", ByteArray(20, { 0 }))
		assertFalse(result.isSuccessful)
	}
}

fun assertByteArraysEqual(expected: ByteArray, actual: ByteArray, message: String? = null) = assertEquals(expected = Base64.getEncoder().encodeToString(expected), actual = Base64.getEncoder().encodeToString(actual), message = message)
