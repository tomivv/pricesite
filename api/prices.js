const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// TODO: korjaa cdon käyttämään puppeteeriä,
// viimeistelyjä jimms haku iffeihin

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
      result.price = parseFloat(document.querySelector('.product-price-container').innerText.replace(',', '.'));
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
    if (ean[0] === '0') {
      await page.goto(`https://www.power.fi/haku/?q=${ean.substring(1, ean.length)}`);
    } else {
      await page.goto(`https://www.power.fi/haku/?q=${ean}`);
    }
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
  let result = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'Verkkokauppa.com',
    productCode: '',
    ean: ''
  };

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.verkkokauppa.com/fi/search?query=${ean}`);
    await page.waitForSelector('.product-list-detailed');
    result = await page.evaluate(() => {
      const data = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Verkkokauppa.com',
        productCode: ''
      };

        data.price = parseFloat(document.querySelector('.product-price__price').innerText.replace(',', '.'));
        data.name = document.querySelector('.list-product-info__link').innerText;
        data.link = document.querySelector('.list-product-info__link').href;
        if (data.price > -1) {
          data.success = true;
        }
      
      return data;
    });

    if (result.link !== '') {
      await page.goto(`${result.link}/lisatiedot`);
      result = await page.evaluate((result) => {
        const data = result;
        data.productCode = document.querySelector('[itemprop=mpn]').innerText;
        data.ean = document.querySelector('[itemprop=gtin13]').innerText.replace(/\s/g, '');
        return data;
      }, result);
    }

    await browser.close();
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
    data = await page.evaluate((productCode) => {
      const result = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Jimms'
      };
      
      let products = document.querySelectorAll('.p_listTmpl1');

      let index = -1;

      for (let i = 0; i < products.length; i++) {
        if (products[i].children[2].children[1].innerText === productCode) {
          index = i;
        }
      }

      if (index !== -1) {

        let origPrice = products[index].children[1].children[0].firstElementChild.innerText.replace(/\s/g, '');
        result.price = parseFloat(origPrice.replace(',', '.'));

        result.name = products[index].children[2].children[0].innerText;

        result.link = products[index].children[2].children[0].children[0].href;

        if (result.price > -1) {
          result.success = true;
        }
      }
      return result;
    }, productCode)

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
    const gigantti = JSON.parse(await priceFromGigantti(SearchTerm));
    const vk = JSON.parse(await priceFromVk(SearchTerm));

    let jimms = {};
    let cdon = {};

    if (vk.ean === SearchTerm) {
      prices.push(vk);
      if (vk.productCode !== '') {
        jimms = JSON.parse(await priceFromJimms(vk.productCode));
        cdon = JSON.parse(await priceFromCdon(vk.productCode));
      }
    }
    if (jimms === {} && gigantti.productCode !== '') {
      jimms = JSON.parse(await priceFromJimms(gigantti.productCode));
    }
    if (cdon === {} && gigantti.productCode !== '') {
      cdon = JSON.parse(await priceFromCdon(gigantti.productCode));
    }

    const power = JSON.parse(await priceFromPower(SearchTerm));

    console.log(`verrataan hintoja`);
  
    prices.push(gigantti);
    prices.push(power);
    prices.push(cdon);
    prices.push(jimms);
  } catch (error) {
    console.error(error);
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
