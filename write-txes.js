const fs = require('fs');
const request = require('request');
require('dotenv').config();

let apiKey;
if (process.env.NETWORK === 'ethereum-goerli-testnet') {
    apiKey = process.env['ETHERSCAN_API_KEY_ethereum-goerli-testnet'];
} else if (process.env.NETWORK === 'moonbeam') {
    apiKey = process.env['ETHERSCAN_API_KEY_moonbeam'];
}

function get(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

async function main() {
    if (process.env.NETWORK === 'ethereum-goerli-testnet') {
        const apiKey = process.env['ETHERSCAN_API_KEY_ethereum-goerli-testnet'];
        const url = `https://api-goerli.etherscan.io/api?module=account&address=0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd&apikey=${apiKey}&action=txlist&sort=desc`;
        const txes = JSON.parse(await get(url)).result;
        fs.writeFileSync(`${process.env.NETWORK}.json`, JSON.stringify(txes, null, 2));
    } else if (process.env.NETWORK === 'moonbeam') {
        const apiKey = process.env['ETHERSCAN_API_KEY_moonbeam'];
        const url = `https://api-moonbeam.moonscan.io/api?module=account&address=0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd&apikey=${apiKey}&action=txlist&sort=desc`;
        const txes = JSON.parse(await get(url)).result;
        fs.writeFileSync(`${process.env.NETWORK}.json`, JSON.stringify(txes, null, 2));
    } else if (process.env.NETWORK === 'arbitrum-nova') {
        const apiKey = process.env['ETHERSCAN_API_KEY_arbitrum-nova'];
        const url = `https://api-nova.arbiscan.io/api?module=account&address=0xd864A45334C7a632cA9149993682354D7f967F28&apikey=${apiKey}&action=txlist&sort=desc`;
        const txes = JSON.parse(await get(url)).result;
        fs.writeFileSync(`${process.env.NETWORK}.json`, JSON.stringify(txes, null, 2));
    }
}

main();