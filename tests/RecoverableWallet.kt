import org.ethereum.core.Account
import org.ethereum.core.AccountState
import org.ethereum.core.Repository
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
import kotlin.test.assertNotEquals

class RecoverableWallet {
	companion object {
		val recoverableWalletContractMetadata by lazy {
			val compilerResult = SolidityCompiler.compile(File("contracts/recoverable-wallet.sol"), true, SolidityCompiler.Options.ABI, SolidityCompiler.Options.BIN, SolidityCompiler.Options.INTERFACE, SolidityCompiler.Options.METADATA)
			assertFalse(compilerResult.isFailed, compilerResult.errors)
			CompilationResult.parse(compilerResult.output).contracts.mapKeys { Regex("^.*:(.*)$").find(it.key)!!.groups[1]!!.value }["RecoverableWallet"]!!
		}
		val tokenContractMetadata by lazy {
			val compilerResult = SolidityCompiler.compile(File("contracts/token.sol"), true, SolidityCompiler.Options.ABI, SolidityCompiler.Options.BIN, SolidityCompiler.Options.INTERFACE, SolidityCompiler.Options.METADATA)
			assertFalse(compilerResult.isFailed, compilerResult.errors)
			CompilationResult.parse(compilerResult.output).contracts.mapKeys { Regex("^.*:(.*)$").find(it.key)!!.groups[1]!!.value }["Token"]!!
		}
		val alice = ECKey()
		val bob = ECKey()
		val carol = ECKey()
		val dan = ECKey()
	}

	lateinit var blockchain: StandaloneBlockchain
	val aliceAddress get() = BigInteger(1, alice.address)
	val bobAddress get() = BigInteger(1, bob.address)
	val carolAddress get() = BigInteger(1, carol.address)
	val danAddress get() = BigInteger(1, dan.address)

	@Before
	fun `setup`() {
		blockchain = StandaloneBlockchain()
				.withAutoblock(true)
				.withAccountBalance(alice.address, BigInteger.valueOf(2).pow(128))
				.withAccountBalance(bob.address, BigInteger.valueOf(2).pow(128))
				.withAccountBalance(carol.address, BigInteger.ZERO)
				.withAccountBalance(dan.address, BigInteger.ONE)
		blockchain.createBlock()
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

	@Test
	fun `can send ether`() {
		blockchain.sender = alice
		val recoverableWallet = blockchain.submitNewContract(recoverableWalletContractMetadata)
		val originalContractBalance = blockchain.blockchain.repository.getBalance(recoverableWallet.address)
		val originalCarolBalance = blockchain.blockchain.repository.getBalance(carol.address)
		blockchain.sendEther(recoverableWallet.address, BigInteger.ONE)
		val intermediateContractBalance = blockchain.blockchain.repository.getBalance(recoverableWallet.address)
		recoverableWallet.callFunction("sendEther", carolAddress, BigInteger.ONE)
		val finalContractBalance = blockchain.blockchain.repository.getBalance(recoverableWallet.address)
		val finalCarolBalance = blockchain.blockchain.repository.getBalance(carol.address)

		assertEquals(expected = BigInteger.ZERO, actual = originalContractBalance)
		assertEquals(expected = BigInteger.ZERO, actual = originalCarolBalance)
		assertEquals(expected = BigInteger.ONE, actual = intermediateContractBalance)
		assertEquals(expected = BigInteger.ZERO, actual = finalContractBalance)
		assertEquals(expected = BigInteger.ONE, actual = finalCarolBalance)
	}

	@Test
	fun `can send tokens`() {
		blockchain.sender = alice
		val recoverableWallet = blockchain.submitNewContract(recoverableWalletContractMetadata)
		val token = blockchain.submitNewContract(tokenContractMetadata)
		val originalContractBalance = token.callConstFunction("balanceOf", recoverableWallet.address)[0] as BigInteger
		val originalCarolBalance = token.callConstFunction("balanceOf", carolAddress)[0] as BigInteger
		token.callFunction("transfer", recoverableWallet.address, BigInteger.ONE)
		val intermediateContractBalance = token.callConstFunction("balanceOf", recoverableWallet.address)[0] as BigInteger
		recoverableWallet.callFunction("sendToken", token.address, carolAddress, BigInteger.ONE)
		val finalContractBalance = token.callConstFunction("balanceOf", recoverableWallet.address)[0] as BigInteger
		val finalCarolBalance = token.callConstFunction("balanceOf", carolAddress)[0] as BigInteger

		assertEquals(expected = BigInteger.ZERO, actual = originalContractBalance)
		assertEquals(expected = BigInteger.ZERO, actual = originalCarolBalance)
		assertEquals(expected = BigInteger.ONE, actual = intermediateContractBalance)
		assertEquals(expected = BigInteger.ZERO, actual = finalContractBalance)
		assertEquals(expected = BigInteger.ONE, actual = finalCarolBalance)
	}

	@Test
	fun `can approve tokens`() {
		blockchain.sender = alice
		val recoverableWallet = blockchain.submitNewContract(recoverableWalletContractMetadata)
		val token = blockchain.submitNewContract(tokenContractMetadata)
	}
}

fun assertByteArraysEqual(expected: ByteArray, actual: ByteArray, message: String? = null) = assertEquals(expected = Base64.getEncoder().encodeToString(expected), actual = Base64.getEncoder().encodeToString(actual), message = message)
