require('dotenv').config()
const webdriver = require('selenium-webdriver')
  By = webdriver.By
  until = webdriver.until
const chrome = require('selenium-webdriver/chrome')
const path = require('path')
const fs = require('fs')


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


}


getArtPrice()
