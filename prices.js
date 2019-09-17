const axios = require('axios')
const cheerio = require('cheerio')

async function priceFromGigantti(ean) {
    axios.get(`https://www.gigantti.fi/search?SearchTerm=${ean}`).then(function (response) {
        const $ = cheerio.load(response.data)
        const elemns = $('meta')

        for (let i = 0; i < elemns.length; i++) {
            if(elemns[i].attribs.itemprop === 'price') {
                console.log('hinta löydetty')
                return parseInt(elemns[i].attribs.content);
            }
        }
        return `tuotetta ei löytynyt`
    })
}

async function lowestPrice() {
    return await priceFromGigantti('5099206077362')
}

module.exports = {
    priceFromGigantti,
    lowestPrice,
}