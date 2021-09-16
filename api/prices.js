const puppeteer = require('puppeteer');

async function priceFromGigantti(ean) {
  let result = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'Gigantti'
  };

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36")
    await page.goto(`https://www.gigantti.fi/search?SearchTerm=${ean}`);

    const name = await page.evaluateHandle(() => {
      return document.querySelector('.product-title').innerText;
    });
    result.name = name._remoteObject.value;

    const link = await page.evaluateHandle(() => {
      return document.URL;
    });
    result.link = link._remoteObject.value;

    const price = await page.evaluateHandle(() => {
      return document.querySelector('.product-price-container').innerText
    });
    result.price = parseFloat(price._remoteObject.value.replace(/\s/g, '').replace(',', '.'));

    if (result.price > -1) {
      result.success = true;
    }

    await browser.close();
  } catch (error) {
    console.error(error);
    await browser.close();
  }
  return JSON.stringify(result);
}

async function priceFromPower(ean) {
  let data = {
    success: false,
    price: -1,
    name: '',
    link: '',
    store: 'Power'
  };

  const browser = await puppeteer.launch();

  try {
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

      const priceInt = '.product-price-new';
      const decimal = '.product-price-decimal-new';
      const name = '.product-name';
      const url = '.product__link';

      const firstResult = document.querySelector('.product-container');

      if (firstResult === null) {
        return result;
      }

      result.name = firstResult.querySelector(name).innerText;
      if (firstResult.querySelector(decimal).firstElementChild.innerText === '') {
        result.price = parseInt(firstResult.querySelector(priceInt).firstElementChild.innerText);
      } else {
        result.price = parseFloat(parseInt(firstResult.querySelector(priceInt).firstElementChild.innerText)+(parseInt(firstResult.querySelector(decimal).firstElementChild.innerText) - 100))
      }
      result.link = firstResult.querySelector(url).href;
      result.success = true;
      return result;
    });
    await browser.close();
  } catch (error) {
    await browser.close();
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
    ean: '',
    productCode: ''
  };
  
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();
    await page.goto(`https://www.verkkokauppa.com/fi/search?query=${ean}`);
    await page.waitForSelector('article');

    const name = await page.evaluateHandle(() => {
      return document.querySelector('article').firstChild.textContent
    });
    result.name = name._remoteObject.value;

    const price = await page.evaluateHandle(() => {
      return document.querySelector('article').querySelector('span').firstElementChild.innerHTML
    });
    result.price = parseFloat(price._remoteObject.value.replace("<small>", "").replace("</small>", "").replace(" ", "").replace(",", "."));
    
    const link = await page.evaluateHandle(() => {
      return document.querySelector('article').firstChild.href
    });
    result.link = link._remoteObject.value;

    if (result.link !== '') {
      await page.goto(result.link);

      const productCode = await page.evaluateHandle(() => {
        return document.querySelector('dd.product-share-details__js-producerId').innerHTML;
      });
      result.productCode = productCode._remoteObject.value;
    }

    if (result.price > -1) {
      result.success = true;
    }

    await browser.close();
  } catch (error) {
    console.error(error);
    await browser.close();
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
 
  const gigantti = JSON.parse(await priceFromGigantti(SearchTerm));
  const vk = JSON.parse(await priceFromVk(SearchTerm));
  const power = JSON.parse(await priceFromPower(SearchTerm));

  prices.push(gigantti);
  prices.push(power);
  prices.push(vk);
  
  if(vk.productCode !== '') {
    const jimms = JSON.parse(await priceFromJimms(vk.productCode))
    prices.push(jimms)
  }

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
