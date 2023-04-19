const fs = require('fs');
const request = require('request');

const apiKey = '...';

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
    const url = `https://api-goerli.etherscan.io/api?module=account&address=0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd&apikey=${apiKey}&action=txlist&sort=desc`;
    const txes = JSON.parse(await get(url)).result;
    console.log(txes.length);
    fs.writeFileSync('txes.json', JSON.stringify(txes, null, 2));
}

main();