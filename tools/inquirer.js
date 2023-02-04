const inquirer = require('inquirer')

const questions = [
  {
    type: 'input',
    name: 'target_artist',
    message: "Your target artist_ID/artist_name. Format: '15079/wassily-kandinsky'",
    default: '15079/wassily-kandinsky',
    filter(val) {
      return val.toLowerCase();
    },
    validate(value) {
      const pass = value.match(/^[0-9]+\/[a-z-]+$/)
      if (pass) return true
      return 'Please enter valid id and artist name'
    }
  },
  {
    type: 'input',
    name: 'date_from',
    message: 'Auction start date. Format: "2022-01-01"',
    default: '2022-01-01',
    validate(value) {
      const pass = value.match(/^\d{4}-\d{2}-\d{2}$/)
      if (pass) {
        let date_test = new Date(value)
        if (date_test instanceof Date && !isNaN(date_test)) return true
      }
      return 'Please enter valid date'
    }
  },
  {
    type: 'list',
    name: 'category',
    message: 'Select target artwork category. Default: Painting',
    choices: ['Painting', 'Print_Multiple', 'Drawing_Watercolor'],
    default: 0
  }
]

module.exports = async () => {
  console.log('Please enter target artist and conditions')
  const prompt = inquirer.createPromptModule()

  const answers = await prompt(questions)
  const categoryId = { Painting: 1, Print_Multiple: 2, Drawing_Watercolor: 7 }  // category Id of artprice.com
  const targetPage = `https://www.artprice.com/artist/${answers.target_artist}/lots/pasts?ipp=60&dt_from=${answers.date_from}&idcategory[]=${categoryId[answers.category]}`
  answers.categoryId = categoryId[answers.category]
  console.log(`Target Page: ${targetPage}`)
  return { targetPage, targetInfo: answers }
}
