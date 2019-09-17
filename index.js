const axios = require('axios')
const cheerio = require('cheerio')
const express = require('express')
const app = express()
const port = 3000

function priceFromGigantti(ean) {
    const gigsu = axios.get(`https://www.gigantti.fi/search?SearchTerm=${ean}`).then(function (response) {
        const $ = cheerio.load(response.data)

        const elemns = $('meta')

        for (let i = 0; i < elemns.length; i++) {
            if(elemns[i].attribs.itemprop === 'price') {
                return elemns[i].attribs.content;
            }
        }
        return `tuotetta ei löytynyt`;
    })
}

const price = priceFromGigantti('192563041252')
console.log(price)

app.get('/', (req, res) => res.send(`tuotteen hinta on: ${priceFromGigantti('192563041252')}`))

app.listen(port, () => console.log(`App running on http://localhost:${port}`))