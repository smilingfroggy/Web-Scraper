require('dotenv').config()
const getTargetPage = require('./tools/inquirer')
const initDriver = require('./tools/initDriver')
const getArtPrice = require('./tools/getArtPrice')

async function crawler () {
  const targetPage = await getTargetPage()
  const driver = await initDriver()
  if (!driver) return

  await getArtPrice(driver, targetPage)
  driver.quit()

}

crawler()