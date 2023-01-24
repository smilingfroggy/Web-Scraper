require('dotenv').config()
const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const path = require('path')
const fs = require('fs')
const testWeb = "https://www.npmjs.com/package/selenium-webdriver"


async function getDriver() {  // 檢查並設定瀏覽器driver
  let driver
  try {
    chrome.getDefaultService()   // 確認是否有預設
    driver = await new Builder().forBrowser('chrome').build()

  } catch (error) {   // 若無預設，使用專案資料夾的chromedriver
    console.warn('No default driver')
    const file_path = './chromedriver.exe'

    if (fs.existsSync(path.join(__dirname, file_path))) {   // 確認exe檔是否存在
      const service = new chrome.ServiceBuilder(path.join(__dirname, file_path)) 
      driver = await new webdriver.Builder().forBrowser('chrome').setChromeService(service).build()
    } else {
      console.error('Cannot set driver path')
    }
  }
  return driver
}

async function openCrawlerWeb () {
  let driver
  try {
    driver = await getDriver()
  } catch (error) {
    console.error('無法建立瀏覽器')
    console.error(error)
    return
  }
  await driver.get(testWeb)
  let title = await driver.getTitle();
  console.log('get title: ', title)
}


openCrawlerWeb();