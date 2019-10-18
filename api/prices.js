/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

async function priceFromGigantti(ean) {
  let data = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'Gigantti',
    productCode: ''
  };

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.gigantti.fi/search?SearchTerm=${ean}`);
    data = await page.evaluate(() => {
      const result = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Gigantti',
        productCode: ''
      };

      let elements = document.querySelectorAll('.spec-table');
      for (let i = 0; i < elements.length; i++) {
        for (let x = 0; x < elements[i].children[0].children.length; x++) {
          if (elements[i].children[0].children[x].firstElementChild.innerText === 'Valmistajan tuotekoodi') {
            result.productCode = elements[i].children[0].children[x].children[1].innerText;
            break;
          } else if (elements[i].children[0].children[x].firstElementChild.innerText === 'Mallin tunnistusnumero') {
            result.productCode = elements[i].children[0].children[x].children[1].innerText;
            break;
          }
        }
        if (result.productCode !== '') { break; }
      }
      // result.price = parseFloat(document.querySelector('.product-price-container').innerText.replace(',', '.'));
      result.name = document.querySelector('.product-title').innerText;
      result.link = document.querySelector('link').baseURI;
      if (result.price > -1) {
        result.success = true;
      }
      return result;
    })
  } catch (error) {
    console.error(error);
  }
  return JSON.stringify(data);
}

async function priceFromPower(ean) {
  let data = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'Power',
    productCode: ''
  };
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.power.fi/haku/?q=${ean}`);
    data = await page.evaluate(() => {
      const result = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Power'
      };

      const main = '.product-price-new';
      const decimal = '.product-price-decimal';
      const name = '.product-name';
      const url = '.product__link';
      const recommended = 'RR-search-recs';

      const recommendedElement = document.getElementById(recommended);

      recommendedElement.parentNode.removeChild(recommendedElement);
      
      if (document.querySelector(main) !== null) {
        result.price = parseInt(document.querySelector('.product-price-new').innerText);
        result.success = true;
        if (document.querySelector('.product-price-decimal').innerText !== "") {
          result.price += parseFloat(document.querySelector(decimal).innerText / 100);
        }
        result.name = document.querySelector(name).innerText;
        result.link = document.querySelector(url).href;
      }
      return result;
    })

    await browser.close();
  } catch (error) {
    console.log(error);
  }

  return JSON.stringify(data);
}

async function priceFromCdon(productCode) {
  const result = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'CDON'
  };

  try {
    const response = await axios.get(`https://cdon.fi/search?q=${productCode}`);

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
        const price = parseFloat(elements[i].children[0].data.substring(3, elements[i].children[0].data.length));
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
  } catch (error) {
    console.log(error);
  }

  return JSON.stringify(result);
}

async function priceFromVk(ean) {
  const result = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'Verkkokauppa.com',
    productCode: ''
  };

  try {
    let response = await axios.get(`https://www.verkkokauppa.com/fi/search?query=${ean}`);
    let $ = cheerio.load(response.data);

    let elements = $('a');

    let productCodeLink = '';

    for (let i = 0; i < elements.length; i++) {
      console.log(elements[i].attribs.class)
      if (elements[i].attribs.class === 'list-product-info__link') {
        result.link = `https://www.verkkokauppa.com${elements[i].attribs.href}`;
        result.name = elements[i].children[0].data;
      }
    }

    elements = $('span');

    for (let i = 0; i < elements.length; i++) {
      if (
        elements[i].attribs.class === 'product-price__price product-price__price--large product-price__mutation-fix'
      ) {
        // const price = parseInt(elements[i].children[0].data.replace(/\s/g, ''));
        const decimal = parseFloat(elements[i].children[0].next.children[0].data / 100);
        result.price = parseFloat(price + decimal);
        if (result.price > -1) {
          result.success = true;
        }
      }
    }

    response = await axios.get(productCodeLink);
    $ = cheerio.load(response.data);

    elements = $('td');

    for (td in elements) {
      console.log(td.attribs)
    }

  } catch (error) {
    console.error(error);
  }

  return JSON.stringify(result);
}

async function priceFromJimms(productCode) {
  let data = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'Jimms'
  };

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.jimms.fi/fi/Product/Search2?q=${productCode}`);
    data = await page.evaluate(() => {
      const result = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Jimms'
      };

      const price = '.p_price';
      const name = '.p_name';

      const noResult = `Hakusanalla ei löydetty suoria osumia, tulokset hakuusi läheisesti liittyviä.`;

        if (document.querySelector('.help-block').innerText !== noResult) {
          // result.price = parseFloat(document.querySelector(price).firstElementChild.innerText.replace(',', '.'));

          result.name = document.querySelector(name).children[0].children[0].innerText;
          result.name += ` ${document.querySelector(name).children[0].children[1].innerText}`;

          result.link = document.querySelector(name).firstElementChild.href;
        }

        if (result.price > -1) {
          result.success = true;
        }
      return result;
    })

    await browser.close();
  } catch (error) {
    console.error(error);
  }

  return JSON.stringify(data);
}

async function lowestPrice(req, res) {
  console.log(``);
  console.log(`Etsitään halvin hinta tuotteelle: ${req.params.ean}`);

  const prices = [];

  const SearchTerm = req.params.ean;

  console.log(`haetaan hintoja sivuilta!`);
  try {
    // const gigantti = JSON.parse(await priceFromGigantti(SearchTerm));
    const power = await priceFromPower(SearchTerm);
    const vk = JSON.parse(await priceFromVk(SearchTerm));
    console.log(vk)
    // console.log(`jos tää toimii niin ihmettelen itekki... ${gigantti.productCode}`)
    // etsitään tuotekoodi näille kahdelle.. ylimmistä..
    const cdon = await priceFromCdon(SearchTerm);
    const jimms = await priceFromJimms(SearchTerm);

    console.log(`verrataan hintoja`);
  
    // prices.push(gigantti);
    prices.push(JSON.parse(power));
    prices.push(JSON.parse(cdon));
    prices.push(vk);
    prices.push(JSON.parse(jimms));
  } catch (error) {
    console.log(error);
  }

  let lowest = 0;
  let indexForLowest = [];

  for (let i = 0; i < prices.length; i++) {
    if (lowest === 0 && prices[i].success === true) {
      lowest = prices[i].price;
      indexForLowest.push(i);
    } else if (prices[i].price < lowest && prices[i].success === true) {
      lowest = prices[i].price;
      indexForLowest = [];
      indexForLowest.push(i);
    } else if (prices[i].price === lowest && prices[i].success === true) {
      indexForLowest.push(i);
    }
  }

  console.log(`valmis!`);
  if (indexForLowest.length === 0) {
    res.status(200).send(JSON.stringify({failed: true}));
  } else if (indexForLowest.length > 1) {
    const multi = [];
    indexForLowest.forEach(result => {
      multi.push(prices[result]);
    });
    res.status(200).send(multi);
  } else {
    res.status(200).send([prices[indexForLowest]]);
  }
}

module.exports = {
  lowestPrice,
};
