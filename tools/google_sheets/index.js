require('dotenv').config()
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];  //  .readonly
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'tools/google_sheets/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'tools/google_sheets/credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the works and price in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1agynQTIUtmDMtY4N4rb07ii6YQLvp_1u7KhrmHXEC9E
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */

async function addSheet(artistName, auth) {
  const sheets = google.sheets({ version: 'v4', auth })
  const title = artistName + '-' + (new Date()).toJSON().slice(0, 10) + '-' + Date.now()
  const request = {
    spreadsheetId: process.env.SPREADSHEET_ID,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: title,
              gridProperties: {
                frozenRowCount: 2
              }
            }
          }
        }
      ]
    }
  }

  try {
    const response = (await sheets.spreadsheets.batchUpdate(request)).data
    const sheetId = response.replies[0].addSheet.properties.sheetId
    console.log('Added sheet: ', title, ' | id:', sheetId)
    return { sheetId, title }
  } catch (error) {
    console.error(error)
  }
}

async function format(sheetId, targetPage, works_data, auth) {
  const sheets = google.sheets({ version: 'v4', auth })
  const request = {
    spreadsheetId: process.env.SPREADSHEET_ID,
    resource: {
      requests: [
        {
          repeatCell: {
            range: {  // row 1
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  fontSize: 14,
                  bold: true
                }
              }
            },
            fields: "userEnteredFormat.textFormat"
          },
        },
        {
          repeatCell: {
            range: {  // row 2
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 2
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: true
                }
              }
            },
            fields: "userEnteredFormat.textFormat"
          },
        },
        {
          repeatCell: {
            range: {  // row 2 col 7 : add source link
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 2,
              startColumnIndex: 7,
              endColumnIndex: 8
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: true,
                  link: { uri: targetPage }
                }
              }
            },
            fields: "userEnteredFormat.textFormat"
          },
        },
        {
          repeatCell: {
            range: {  // row of average
              sheetId: sheetId,
              startRowIndex: works_data.length + 3,
              endRowIndex: works_data.length + 4,
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: true
                }
              }
            },
            fields: "userEnteredFormat.textFormat"
          }
        }
      ]
    }
  }
  try {
    await sheets.spreadsheets.batchUpdate(request)
  } catch (error) {
    console.log(error)
  }
}

async function writeSheet(title, artistName, date_from, category, result_data, auth) {
  const sheets = google.sheets({ version: 'v4', auth })
  const request = {
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'USER_ENTERED',
    range: `${title}!A:ZZ`,
    resource: {
      values: [
        [`Auction results of ${artistName} from ${date_from} to ${new Date().toISOString().slice(0, 10)}, in ${category} (${result_data.works_data.length} records)`],
        ['Work Title', 'Medium', 'Size', 'Auction Date', 'Auction House', 'Hammer Price (USD)', 'Value per area', 'Source Link'],   // title of table
        ...result_data.works_data,
        [],
        ['', '', '', '', '', 'Average value per area', `=AVERAGE(G3:G${result_data.works_data.length + 2})`]
      ]
    }
  }

  try {
    await sheets.spreadsheets.values.update(request)
    console.log(`Sheet '${title}' Updated`)
    console.log(`See https://docs.google.com/spreadsheets/d/${process.env.SPREADSHEET_ID}`)
  } catch (error) {
    console.error(error)
  }
}

async function updateGoogleSheets(targetPage, artistName, date_from, category, result_data) {
  let auth = await authorize()
  let { sheetId, title } = await addSheet(artistName, auth)
  console.log('sheetId, title', sheetId, title)
  await writeSheet(title, artistName, date_from, category, result_data, auth)
  await format(sheetId, targetPage, result_data.works_data, auth)
}

module.exports = updateGoogleSheets