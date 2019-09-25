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

  try {

    const response = await axios.get(`https://www.gigantti.fi/search?SearchTerm=${ean}`);
    const $ = cheerio.load(response.data);

    let elements = $('div');

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].attribs.class === 'search-results-list any-1-1' || elements[i].attribs.class === 'no-search-result main-content col any-5-6 M-1-1') {
        return JSON.stringify(result);
      }
    }

    elements = $('meta');

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
  }
  catch(error) {
    console.log(error);
  };

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

  // pwr-product-list

  try {

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
        if (document.querySelector('pwr-product-list').children.length === 0) {
          return result;
        }
        if (document.querySelector(decimal) !== null) {
          result.price += parseFloat(document.querySelector(main).innerText);
          result.success = true;
        }
        else if (document.querySelector(decimal) !== null) {
          result.price += parseFloat(document.querySelector(decimal).innerText / 100);
        }
        else if (document.querySelector(name) !== null) {
          result.name = document.querySelector(name).innerText;
        }
        else if (document.querySelector(url) !== null) {
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
  }
  catch (error) {
    console.log(error);
  }

  return JSON.stringify(result);
}

async function priceFromCdon(ean) {
  const result = {
    success: false,
    price: -1,
    name: '',
    link: '',
  };

  try {

    const response = await axios.get(`https://cdon.fi/search?q=${ean}`);

    const $ = cheerio.load(response.data);
    $('nav').remove();


    let elements = $('p');

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].attribs.class === 'did-you-mean') {
        return JSON.stringify(result);
      }
    }

    elements = $('div');

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].attribs.class === 'price') {
        const price = parseFloat(elements[i].children[0].data.substring(3,elements[i].children[0].data.length));
        result.price = price;
        result.success = true;
      }
      if (elements[i].attribs.class === 'product-title-wrapper') {
        for (let x = 0; x < elements[i].children.length; x++) {
          if (elements[i].children[x].name === 'a') {
            result.link = `https://cdon.fi${elements[i].children[x].attribs.href}`;
            result.name = elements[i].children[x].attribs.title;
          }
        }
      }
    }
  }
  catch (error) {
    console.log(error);
  }

  return JSON.stringify(result);
}

async function lowestPrice(req, res) {
  console.log(`Etsitään halvin hinta tuotteelle: ${req.params.ean}`)

  let prices = [];

  const gigantti = await priceFromGigantti(req.params.ean);
  const power = await priceFromPower(req.params.ean);
  const cdon = await priceFromCdon(req.params.ean);

  prices.push(JSON.parse(gigantti));
  prices.push(JSON.parse(power));
  prices.push(JSON.parse(cdon));

  let lowest = 0;
  let indexForLowest = [];

  for (let i = 0; i < prices.length; i++) {
    if (lowest === 0 && prices[i].success) {
      lowest = prices[i].price;
    }
    else if (prices[i].price < lowest && prices[i].success) {
      lowest = prices[i].price;
      indexForLowest = [];
      indexForLowest.push(i);
    }
     else if (prices[i].price === lowest && prices[i].success) {
      indexForLowest.push(i);
    }
  }

  // TODO: funktio joka palauttaa tarvittaessa 2 tai useampaa sivustoa.
  // TODO: jos mikään sivu ei löydä hintaa palauta virhe.

  res.status(200).send(prices[indexForLowest]);
}

module.exports = {
  lowestPrice,
};
