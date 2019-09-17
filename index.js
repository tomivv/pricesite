const express = require('express')
const app = express()
const port = 3000

const prices = require('./prices')

const testi = prices.lowestPrice()
console.log(testi)

app.get('/', (req, res) => res.send(`tuotteen hinta on: ${testi}`))

app.listen(port, () => console.log(`App running on http://localhost:${port}`))