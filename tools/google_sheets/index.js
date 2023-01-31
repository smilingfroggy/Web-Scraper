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
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
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
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */

async function addSheet(artistName, auth) {
  const sheets = google.sheets({ version: 'v4', auth })
  const title = artistName + '-' + (new Date()).toJSON().slice(0,10) + '-' + Date.now()
  const request = {
    spreadsheetId: process.env.SPREADSHEET_ID,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: title,
              gridProperties: {
                frozenRowCount: 1
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

async function writeSheet(title, result_data, auth) {
  const sheets = google.sheets({ version: 'v4', auth })
  const request = {
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'USER_ENTERED',
    range: `${title}!A:ZZ`,
    resource: {
      values: result_data
    }
  }

  try {
    await sheets.spreadsheets.values.update(request)
    console.log(`Sheet '${title}' Updated`)
  } catch (error) {
    console.error(error)
  }
}

async function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  console.log('Name, Major:');
  rows.forEach((row) => {
    // Print columns A and E, which correspond to indices 0 and 4.
    console.log(`${row[0]}, ${row[4]}`);
  });
}

async function updateGoogleSheets(artistName = 'wassily-kandinsky', result_data) {
  let auth = await authorize()
  let { sheetId, title } = await addSheet(artistName, auth)
  console.log('sheetId, title', sheetId, title)
  await writeSheet(title, result_data, auth)
}

module.exports = updateGoogleSheets