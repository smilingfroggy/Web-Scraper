require('dotenv').config()
const webdriver = require('selenium-webdriver')
  By = webdriver.By
  until = webdriver.until
const chrome = require('selenium-webdriver/chrome')
const path = require('path')
const fs = require('fs')
const login_page = "https://www.artprice.com/identity"
const artPriceAC = process.env.ARTPRICE_AC
const artPricePW = process.env.ARTPRICE_PW

async function getDriver() {  // 檢查並設定瀏覽器driver
  let driver
  const options = new chrome.Options()
  options.setPageLoadStrategy('none')
  options.addArguments('--disable-blink-features=AutomationControlled')
  try {
    chrome.getDefaultService()   // 確認是否有預設
    driver = await new Builder().forBrowser('chrome').build()

  } catch (error) {   // 若無預設，使用專案資料夾的chromedriver
    console.warn('No default driver')
    const file_path = './chromedriver.exe'

    if (fs.existsSync(path.join(__dirname, file_path))) {   // 確認exe檔是否存在
      const service = new chrome.ServiceBuilder(path.join(__dirname, file_path)) 
      driver = await new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeService(service)
        .setChromeOptions(options)
        .build()
    } else {
      console.error('Cannot set driver path')
    }
  }
  return driver
}

async function getArtPrice() {
  let driver
  try {
    driver = await getDriver()
  } catch (error) {
    console.error('無法建立瀏覽器')
    console.error(error)
    return
  }

  // login
  await driver.get(login_page)
  await driver.sleep(10000)
  const account_input = await driver.wait(until.elementLocated(By.xpath(`//*[@id="login"]`)))
  account_input.sendKeys(artPriceAC)
  const password_input = await driver.wait(until.elementLocated(By.xpath(`//*[@id="pass"]`)))
  password_input.sendKeys(artPricePW)
  const login_submit = await driver.wait(until.elementLocated(By.xpath(`//*[@id="weblog_form"]/button`)))
  login_submit.click()
  await driver.sleep(12000)

  let targetPage = "https://www.artprice.com/artist/15079/wassily-kandinsky/lots/pasts?idcategory[]=2&ipp=60&dt_from=2022-01-01"

  await driver.get(targetPage)
  await driver.sleep(12000)

  // close cookie settings
  const alert_btn = await driver.wait(until.elementLocated(By.className('sln-accept-cookies')))
  alert_btn.click()


  // select USDollar
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


  // get number of results
  const counts_text= await driver.wait(until.elementLocated(By.className('searchbar-count'))).getText()
  const counts = Number(counts_text.split(' ')[0])
  const pages = Math.ceil(counts / 60)
  console.log(`===== ${counts} artworks in ${pages} pages =====`)

  const lot_containers = await driver.findElements(By.className('lot-container'))   // all works - 60 items  [WebElement {}, WebElement {}, ...]
  let result_data = await getPageData(lot_containers)  // add results from 1st page

  for (let page = 2; page <= pages; page++) {     // add results from other pages
    await driver.get(targetPage + `&p=${page}`)    
    await driver.sleep(10000)
    const lot_containers = await driver.findElements(By.className('lot-container'))

    const dataPerPage = await getPageData(lot_containers)
    result_data = result_data.concat(dataPerPage)
  }
  
  // console.log(result_data)
  console.log('Total results: ', result_data.length)
  let averageVPA = (result_data.reduce((a,b) => a + b) / result_data.length).toFixed(2)
  console.log('Average value per area', averageVPA)
  
}


async function getPageData(lot_containers) {
  const data = []
  for (const lot_container of lot_containers) {
    const lot_blocks = await lot_container.findElements(By.className('lot-datas-block'))
    let price_raw
    try {
      price_raw = await lot_blocks[3].findElement(By.css('span')).getText()
    } catch (error) {
      price_raw = await lot_blocks[2].findElement(By.css('span')).getText()
    }
    const area_span = await lot_blocks[1].findElements(By.css('span'))
    const area_raw = await area_span[1]?.getText() || null

    // console.log('record:', 'price: ', price_raw, 'area: ', area_raw)
    if (!price_raw.includes('Not') && area_raw != null) {
      // calculate value per area
      let price = Number(price_raw.slice(2).split(',').join(''))  // '$ 1,400' -> 1400
      let area_arr = area_raw.split(' ')
      let area = area_arr[0] * area_arr[2]   // cm^2
      let vpa = Number((price / area).toFixed(2))
      data.push(vpa)
      console.log([price_raw, area_raw], [price, area, vpa])
    }
  }
  return data
}

getArtPrice()
