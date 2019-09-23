/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
const axios = require('axios');
const cheerio = require('cheerio');
const Nightmare = require('nightmare');

const nightmare = Nightmare({ show: false });

async function priceFromGigantti(ean) {
  const result = {
    success: false,
    price: -1,
    name: '',
    link: '',
  };

  const response = await axios.get(`https://www.gigantti.fi/search?SearchTerm=${ean}`);
  const $ = cheerio.load(response.data);
  const elemns = $('meta');

  for (let i = 0; i < elemns.length; i++) {
    if (elemns[i].attribs.itemprop === 'price') {
      result.price = parseFloat(elemns[i].attribs.content);
      result.success = true;
    }
  }

  if (result.price === -1) {
    result.success = false;
  }

  return result.price;
}

async function priceFromPower(ean) {
  const main = '.product-price-new';
  const decimal = '.product-price-decimal';

  const result = {
    success: false,
    price: -1,
    name: '',
    link: '',
  };

  await nightmare.goto(`https://www.power.fi/haku/?q=${ean}`);

  await nightmare.wait(main);

  result.price = await nightmare.evaluate(
    (main, decimal) => {
      let price;
      if (document.querySelector(main) !== null) {
        price += parseFloat(document.querySelector(main).innerText);
      }
      if (document.querySelector(decimal) !== null) {
        price += parseFloat(document.querySelector(decimal).innerText / 100);
      }
      return price;
    },
    main,
    decimal
  );

  await nightmare.end();

  return result.price;
}

async function lowestPrice(req, res) {
  const gigsu = await priceFromGigantti(req.params.ean);
  console.log(`gigsu: ${gigsu}`);
  const power = await priceFromPower(req.params.ean);
  console.log(`power: ${power}`);
  if (gigsu < power) {
    res.status(200).send('gigsu');
  }
  if (power < gigsu) {
    res.status(200).send('power');
  } else {
    res.status(200).send('samat');
  }
}

module.exports = {
  lowestPrice,
};
