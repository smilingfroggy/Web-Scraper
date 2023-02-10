require('dotenv').config()
const getTargetPage = require('./tools/inquirer')
const initDriver = require('./tools/initDriver')
const getArtPrice = require('./tools/getArtPrice')
const updateGoogleSheets = require('./tools/google_sheets/index')

async function scraper () {
  const { targetPage, targetInfo } = await getTargetPage()
  const driver = await initDriver()
  if (!driver) return

  const result_data = await getArtPrice(driver, targetPage)
  driver.quit()

  console.log('result_data: ', result_data)
  await updateGoogleSheets(targetInfo.target_artist, targetInfo.date_from, targetInfo.category , result_data)  // result_data(nest array)

}

scraper()