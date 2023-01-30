const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const path = require('path')
const fs = require('fs')

module.exports = async function initDriver() {    // 檢查並設定瀏覽器driver
  let driver
  const options = new chrome.Options()
  options.setPageLoadStrategy('none')
  options.addArguments('--disable-blink-features=AutomationControlled')
  try {
    chrome.getDefaultService()   // 確認是否有預設
    driver = await new Builder().forBrowser('chrome').build()

  } catch (error) {   // 若無預設，使用專案資料夾的chromedriver
    console.warn('No default driver')
    const file_path = '../chromedriver.exe'

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
  await driver.manage().window().maximize()
  return driver
}