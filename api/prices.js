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
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    if(ean.charAt(0) === "0") {
      await page.goto(`https://www.gigantti.fi/search?SearchTerm=${ean.substring(1)}`, {
        waitUntil: ['load']
      });
    } else {
      await page.goto(`https://www.gigantti.fi/search?SearchTerm=${ean}`, {
        waitUntil: ['load']
      });
    }
    data = await page.evaluate(() => {
      let result = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Gigantti',
        productCode: ''
      };

      const elements = document.querySelectorAll('.spec-table');
      // productCode
      console.log('testi')
      for (let i = 0; i < elements.length; i++) {
        for (let x = 0; x < elements[i].children[0].children.length; x++) {
          if (
            elements[i].children[0].children[x].firstElementChild.innerText ===
            'Valmistajan tuotekoodi'
          ) {
            result.productCode = elements[i].children[0].children[x].children[1].innerText;
            break;
          } else if (
            elements[i].children[0].children[x].firstElementChild.innerText ===
            'Mallin tunnistusnumero'
          ) {
            result.productCode = elements[i].children[0].children[x].children[1].innerText;
            break;
          }
        }
        if (result.productCode !== '') {
          break;
        }
      }
      if (document.querySelector('.product-price-container') !== null) {
        result.price = parseFloat(
          document
            .querySelector('.product-price-container')
            .innerText.replace(/\s/g, '')
            .replace(',', '.')
        );
      }
      if (document.querySelector('.product-title') !== null) {
        result.name = document.querySelector('.product-title').innerText;
      }
      result.link = document.URL;
      if (result.price > -1) {
        result.success = true;
      }
      return result;
    });

    await browser.close();
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
        if (document.querySelector('.product-price-decimal').innerText !== '') {
          result.price += parseFloat(document.querySelector(decimal).innerText / 100);
        }
        result.name = document.querySelector(name).innerText;
        result.link = document.querySelector(url).href;
      }
      return result;
    });

    await browser.close();
  } catch (error) {
    console.error(error);
  }

  return JSON.stringify(data);
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
    await page.goto(`https://www.verkkokauppa.com/fi/search?query=${ean}`, {
      waitUntil: ['load', 'networkidle2']
    });
    result = await page.evaluate(() => {
      const data = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Verkkokauppa.com',
        productCode: '',
        ean: ''
      };
      data.price = parseFloat(
        document
          .querySelector('.product-price__price')
          .innerText.replace(/\s/g, '')
          .replace(',', '.')
      );
      data.name = document.querySelector('.list-product-info__link').innerText;
      data.link = document.querySelector('.list-product-info__link').href;
      if (data.price > -1) {
        data.success = true;
      }

      return data;
    });

    if (result.link !== '') {
      await page.goto(`${result.link}/lisatiedot`);
      result = await page.evaluate(result => {
        const data = result;
        if (document.querySelector('[itemprop=mpn]') !== null) {
          data.productCode = document.querySelector('[itemprop=mpn]').innerText;
        }
        if (document.querySelector('[itemprop=gtin13]') !== null) {
          data.ean = document.querySelector('[itemprop=gtin13]').innerText.replace(/\s/g, '');
        }
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
    data = await page.evaluate(productCode => {
      const result = {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Jimms'
      };

      const products = document.querySelectorAll('.p_listTmpl1');

      let index = -1;

      for (let i = 0; i < products.length; i++) {
        if (products[i].children[2].children[1].innerText === productCode) {
          index = i;
        }
      }

      if (index !== -1) {
        const origPrice = products[
          index
        ].children[1].children[0].firstElementChild.innerText.replace(/\s/g, '');
        result.price = parseFloat(origPrice.replace(',', '.'));

        result.name = products[index].children[2].children[0].innerText;

        result.link = products[index].children[2].children[0].children[0].href;

        if (result.price > -1) {
          result.success = true;
        }
      }
      return result;
    }, productCode);

    await browser.close();
  } catch (error) {
    console.error(error);
  }

  return JSON.stringify(data);
}

async function lowestPrice(req, res) {
  const prices = [];

  const SearchTerm = req.params.ean;
  try {
    const gigantti = JSON.parse(await priceFromGigantti(SearchTerm));
    const vk = JSON.parse(await priceFromVk(SearchTerm));

    let jimms = {
      success: false,
      price: -1,
      name: '',
      link: '',
      store: 'Jimms'
    };

    if (vk.productCode !== '') {
      jimms = JSON.parse(await priceFromJimms(vk.productCode));
    }
    if (jimms === {
        success: false,
        price: -1,
        name: '',
        link: '',
        store: 'Jimms'
      } && gigantti.productCode !== '') {
      jimms = JSON.parse(await priceFromJimms(gigantti.productCode));
    }

    // const power = JSON.parse(await priceFromPower(SearchTerm));

    prices.push(gigantti);
    // prices.push(power);
    prices.push(vk);
    if (jimms !== {}) {
      prices.push(jimms);
    }
  } catch (error) {
    console.error(error);
  }
  console.log(prices)
  for (let i = 0; i < prices.length; i += 1) {
    if (prices[i].price === -1) {
      prices.splice(i, 1);
      i -= 1;
    }
  }

  prices.sort((a, b) => {
    return a.price - b.price;
  });

  while (prices.length > 3) {
    prices.pop();
  }

  if (prices.length === 0) {
    res.status(200).send(JSON.stringify({ failed: true }));
  } else {
    res.status(200).send(prices);
  }
}

module.exports = {
  lowestPrice
};
