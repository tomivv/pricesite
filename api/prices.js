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
  let elements = $('meta');

  for (let i = 0; i < elements.length; i++) {
    if (elements[i].attribs.itemprop === 'price') {
      result.price = parseFloat(elements[i].attribs.content);
      result.success = true;
    }
  }

  elements = $('h1');

  for (let i = 0; i < elements.length; i++) {
    if(elements[i].attribs.class === 'product-title') {
      result.name = elements[i].children[0].data;
    }
  }

  elements = $('link');

  for (let i = 0; i < elements.length; i++) {
    if (elements[i].attribs.itemprop === 'url') {
      result.link = elements[i].attribs.href;
    }
  }

  return JSON.stringify(result);
}

async function priceFromPower(ean) {
  const main = '.product-price-new';
  const decimal = '.product-price-decimal';
  const name = '.product-name';
  const url = '.product__link';

  let result = {
    success: false,
    price: -1,
    name: '',
    link: '',
  };

  await nightmare.goto(`https://www.power.fi/haku/?q=${ean}`);

  await nightmare.wait();

  result = await nightmare.evaluate(
    (main, decimal, name, url) => {
      let result = {
        success: false,
        price: -1,
        name: '',
        link: '',
      };
      if (document.querySelector(decimal) !== null) {
        result.price += parseFloat(document.querySelector(main).innerText);
        result.success = true;
      }
      if (document.querySelector(decimal) !== null) {
        result.price += parseFloat(document.querySelector(decimal).innerText / 100);
      }
      if (document.querySelector(name) !== null) {
        result.name = document.querySelector(name).innerText;
      }
      if (document.querySelector(url) !== null) {
        result.link = document.querySelector(url).href;
      }

      return result;
    },
    main,
    decimal,
    name,
    url
  );

  await nightmare.end();

  await nightmare.catch();

  return JSON.stringify(result);
}

async function lowestPrice(req, res) {
  const gigsu = await priceFromGigantti(req.params.ean);
  console.log(`gigsu: ${gigsu}`);
  const power = await priceFromPower(req.params.ean);
  console.log(`power: ${power}`);
  if (gigsu < power) {
    res.status(200).send(gigsu);
  }
  if (power < gigsu) {
    res.status(200).send(power);
  } else {
    res.status(200).send('samat');
  }
}

module.exports = {
  lowestPrice,
};
