const webdriver = require('selenium-webdriver')
const { By, until } = webdriver
const login_page = "https://www.artprice.com/identity"
const artPriceAC = process.env.ARTPRICE_AC
const artPricePW = process.env.ARTPRICE_PW

module.exports = async function getArtPrice(driver, targetPage) {
  await login(driver)

  await driver.get(targetPage)
  await driver.sleep(12000)

  // select currency-USD & get pages
  let pages
  try {
    await selectUSD(driver)

    // get number of results
    const counts_text = await driver.wait(until.elementLocated(By.className('searchbar-count')), 10000).getText()
    const counts = Number(counts_text.split(' ')[0])
    pages = Math.ceil(counts / 60)
    console.log(`===== ${counts} artworks in ${pages} pages =====`)
  } catch (error) {   // e.g. No match found for your search.
    const message = await driver.findElement(By.css('h2.text-center')).getText()
    console.log(error.name, error.message)
    console.log('Result:', message)
    process.exit()
  }

  // get artwork data
  const lot_containers = await driver.findElements(By.className('lot-container'))   // all works - 60 items  [WebElement {}, WebElement {}, ...]
  let works_data = await getPageData(lot_containers)  // add results from 1st page [[title, medium, size,...], [title, medium, size,...], ...]

  for (let page = 2; page <= pages; page++) {     // add results from other pages
    await driver.get(targetPage + `&p=${page}`)
    await driver.sleep(10000)
    const lot_containers = await driver.findElements(By.className('lot-container'))

    const dataPerPage = await getPageData(lot_containers)
    works_data = works_data.concat(dataPerPage)
  }

  let averageVPA = (works_data.reduce((a, b) => a + b[6], 0) / works_data.length).toFixed(2)
  console.log('Total valid results: ', works_data.length)
  console.log('Average value per area', averageVPA)
  return { works_data, averageVPA }

}


async function login(driver) {
  await driver.get(login_page)
  await driver.sleep(3000)

  // close cookie settings
  const alert_btn = await driver.wait(until.elementLocated(By.className('sln-accept-cookies')))
  alert_btn.click()

  // enter user name & password
  const account_input = await driver.wait(until.elementLocated(By.xpath(`//*[@id="login"]`)))
  account_input.sendKeys(artPriceAC)
  const password_input = await driver.wait(until.elementLocated(By.xpath(`//*[@id="pass"]`)))
  password_input.sendKeys(artPricePW)
  const login_submit = await driver.wait(until.elementLocated(By.xpath(`//*[@id="weblog_form"]/button`)))
  login_submit.click()
  await driver.sleep(5000)

}

async function selectUSD(driver) {
  const preferences_btn = await driver.findElement(By.css('.common-preferences .title'))
  preferences_btn.click()
  await driver.sleep(500)

  const currency_div = await driver.findElement(By.className('artp-input-group'))
  const currency_btn = await currency_div.findElement(By.css('button'))
  currency_btn.click()
  await driver.sleep(500)

  const currency_selects = await currency_div.findElements(By.css('.dropdown-menu li'))
  currency_selects[1].click()   //  select 2nd - USD
  await driver.sleep(500)

  const apply_btn = await driver.findElement(By.css('.submit-and-cancel .pull-right'))
  apply_btn.click()
  console.log('===== USD selected ======')
  await driver.sleep(10000)
}

async function getPageData(lot_containers) {
  const data = []
  for (const lot_container of lot_containers) {
    const lot_blocks = await lot_container.findElements(By.className('lot-datas-block'))
    const work_title = await lot_container.findElement(By.className('lot-datas-title-container')).getText()
    const medium = await lot_blocks[0].getText()
    const area_span = await lot_blocks[1].findElements(By.css('span'))
    const area_raw = await area_span[1]?.getText() || null
    const link = await lot_container.findElement(By.css('a.sln_lot_show')).getAttribute('href')

    let price_raw, auction_date, auction_house
    try {   // some results don't include estimate price and cause error
      price_raw = await lot_blocks[3].findElement(By.css('span')).getText()
      auction_date = await lot_blocks[4].getText()
      auction_house = await lot_blocks[5].getText()
    } catch (error) {
      price_raw = await lot_blocks[2].findElement(By.css('span')).getText()
      auction_date = await lot_blocks[3].getText()
      auction_house = await lot_blocks[4].getText()
    }

    if (!price_raw.includes('Not') && area_raw != null) {
      // calculate value per area
      let price = Number(price_raw.slice(2).split(',').join(''))  // '$ 1,400' -> 1400
      let area_arr = area_raw.split(' ')
      let area = area_arr[0] * area_arr[2]   // cm^2
      let vpa = Number((price / area).toFixed(2))
      data.push([work_title, medium, area_raw, auction_date, auction_house, price_raw, vpa, link])
    }
  }
  return data
}

