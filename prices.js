const axios = require('axios')
const cheerio = require('cheerio')

async function priceFromGigantti(ean) {
    const response = await  axios.get(`https://www.gigantti.fi/search?SearchTerm=${ean}`)
    const $ = cheerio.load(response.data)
    const elemns = $('meta')

    for (let i = 0; i < elemns.length; i++) {
        if(elemns[i].attribs.itemprop === 'price') {
            return parseInt(elemns[i].attribs.content);
        }
    }
    return `tuotetta ei löytynyt`
    
}

async function lowestPrice() {
    const lowest = await priceFromGigantti('5099206077362')
    return lowest
}

module.exports = {
    priceFromGigantti,
    lowestPrice,
}