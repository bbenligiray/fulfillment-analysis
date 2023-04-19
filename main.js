const fs = require('fs');
const assert = require('assert');
const ethers = require('ethers');

const methodIds = {
    fulfill: '0x1decbf18',
    fail: '0x52e41f99',
    transfer: '0x'
};

function timestampToISOString(timestamp) {
    return new Date(timestamp * 1000).toISOString();
}

async function main() {
    const txes = JSON.parse(fs.readFileSync('ethereum-goerli-testnet.json'));
    for (const tx of txes) {
        if (tx.methodId === methodIds.fulfill) {
            const decodedInput = ethers.utils.defaultAbiCoder.decode(
                ['bytes32', 'address', 'address', 'bytes4', 'bytes', 'bytes'],
                ethers.utils.hexDataSlice(tx.input, 4));
            tx.decodedInput = {
                requestId: decodedInput[0],
                airnode: decodedInput[1],
                fulfillAddress: decodedInput[2],
                fulfillFunctionId: decodedInput[3],
                data: decodedInput[4],
                signature: decodedInput[4],
            }
        } else if (tx.methodId === methodIds.fail) {
            const decodedInput = ethers.utils.defaultAbiCoder.decode(
                ['bytes32', 'address', 'address', 'bytes4', 'string'],
                ethers.utils.hexDataSlice(tx.input, 4));
            tx.decodedInput = {
                requestId: decodedInput[0],
                airnode: decodedInput[1],
                fulfillAddress: decodedInput[2],
                fulfillFunctionId: decodedInput[3],
                errorMessage: decodedInput[4],
            }
        } else {
            tx.decodedInput = {};
        }
    }
    // We have data from about a year
    console.log(`Starting ${timestampToISOString(txes[txes.length - 1].timeStamp)}`);
    console.log(`Ending ${timestampToISOString(txes[0].timeStamp)}`);

    const erroredTxes = txes.filter((tx) => { return tx.isError === '1' });
    const erroredFulfillTxes = erroredTxes.filter((tx) => { return tx.methodId === methodIds.fulfill });
    const erroredFailTxes = erroredTxes.filter((tx) => { return tx.methodId === methodIds.fail });
    const erroredTransferTxes = erroredTxes.filter((tx) => { return tx.methodId === methodIds.transfer });
    // 1/10 of all transactions are errored. Majority of these are fail transactions.
    console.log(`\nTotal txes: ${txes.length}`);
    console.log(`Errored txes: ${erroredTxes.length}`);
    console.log(`Errored fulfill txes: ${erroredFulfillTxes.length}`);
    console.log(`Errored fail txes: ${erroredFailTxes.length}`);
    // It's expected for transfer txes to error, no need to investigate these further.
    console.log(`Errored transfer txes: ${erroredTransferTxes.length}`);

    // Airnode attempted to fulfill two transactions that it has already failed 10+ minutes ago.
    // Both of these happened on September 28, 2022. Seems to be a chain anomaly, will not
    // investigate further.
    for (const erroredFulfillTx of erroredFulfillTxes) {
        const txesWithMatchingRequestId = txes.filter((tx) => { return tx.decodedInput.requestId === erroredFulfillTx.decodedInput.requestId && tx.hash !== erroredFulfillTx.hash });
        assert(txesWithMatchingRequestId.length === 1);
        assert(txesWithMatchingRequestId[0].methodId === methodIds.fail);
    }

    // Will go through errored fails one by one
    console.log('\nGoing through requests for which there is at least one errored fail tx...');
    const txesForRequestIdIsCovered = {};
    for (const erroredFailTx of erroredFailTxes) {
        const requestId = erroredFailTx.decodedInput.requestId;
        if (!txesForRequestIdIsCovered[requestId]) {
            txesForRequestIdIsCovered[requestId] = true;
            console.log(`\nRequest ID: ${requestId}`);
            if (erroredFailTx.decodedInput.airnode === '0x6238772544f029ecaBfDED4300f13A3c4FE84E1D') {
                console.log('Request made to Nodary');
            }
            console.log(`Most recent activity: ${timestampToISOString(erroredFailTx.timeStamp)}`);
            const successfulTxesWithMatchingRequestId = txes.filter((tx) => { return tx.decodedInput.requestId === requestId && tx.isError === '0' });
            assert(successfulTxesWithMatchingRequestId.length <= 1);
            if (successfulTxesWithMatchingRequestId.length === 1) {
                console.log('There is a successful tx with matching request ID:');
                console.log(successfulTxesWithMatchingRequestId[0].decodedInput);
            }
            const erroredTxesWithMatchingRequestId = erroredTxes.filter((tx) => { return tx.decodedInput.requestId === requestId });
            console.log(`Errored fail txes: ${erroredTxesWithMatchingRequestId.length}`);
            console.log('Error messages of errored fail txes and their frequency:');
            const errorMessagesToFrequency = erroredTxesWithMatchingRequestId.reduce((acc, tx) => {
                if (acc[tx.decodedInput.errorMessage]) {
                    acc[tx.decodedInput.errorMessage]++;
                } else {
                    acc[tx.decodedInput.errorMessage] = 1;
                }
                return acc;
            }, {});
            console.log(errorMessagesToFrequency);
        }
    }

    // Print error message for successful fail txes for reference
    console.log('Error messages of successful fail txes and their frequency:');
    const errorMessagesForSuccessfulFailTxes = txes.reduce((acc, tx) => {
        if (tx.methodId === methodIds.fail && tx.isError === '0') {
            if (acc[tx.decodedInput.errorMessage]) {
                acc[tx.decodedInput.errorMessage]++;
            } else {
                acc[tx.decodedInput.errorMessage] = 1;
            }
        }
        return acc;
    }, {});
    console.log(errorMessagesForSuccessfulFailTxes);
}

main();
