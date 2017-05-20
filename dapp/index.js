window.parity.api.subscribe('eth_blockNumber', function (error, blockNumber) {
	if (error) {
		console.log('error', error);
		return;
	}

	document.getElementById('container').innerHTML = blockNumber.toFormat(0);
});
