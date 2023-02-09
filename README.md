## Introduction

A practice of web scrapping with Selenium-webdriver, and saving results to google sheets.

The market value of art is affected by many aspects, including artist, size, medium, style, subject, etc. 
This project is to simplify the collection of auction price data, accelerate research for personal use, and hopefully give an insight into art market.

Enter your target artist, its personal code, start date of auction, and category at command line, this application will gather matched records and save it to designated google sheet.



## Installation

1. __Clone it__

    ```$ git clone https://github.com/smilingfroggy/crawler_practice.git```

2. __Install packages__

    ```$ yarn install```

3. Create __`.env` file__ in the app's root directory 
    
    ```$ touch .env```

4.  Set up environment variables at  `.env` file 
  
    __4-1. Account & Password__:
    
    Set up your Artprice account and password. Create an account at artprice.com, and subscribe.

    __4-2. Google Sheet ID__:
    
    Create your google sheets to store results. Get your google sheet ID from address bar

5. __Create projects and access credentials__

    5-1. Create new project on [Google Cloud Console](https://console.cloud.google.com/) , enable Google Sheets API, and set up OAuth consent screen.
    <!-- User type: external -->
    <!-- Status: testing(& add test users) or publish -->
    5-2. Create credentials with OAuth 2.0 Client IDs, select desktop app, download JSON file, name it as "credentials.json" and move it into /tools/google_sheets directory.

    Reference: [Google Workspace Guide - Node.js](https://developers.google.com/drive/api/quickstart/nodejs?hl=en)

6. __For Windows - Download chromedriver__
    
    Download chromedriver.exe which version matches your own chrome from [ChromeDriver](https://chromedriver.chromium.org/home). Save it at the root directory.



## Usage

1.  __Run it__

    ```$ yarn start```

2.  __Enter target conditions at CLI__

    A.  Artist's code and name in the specified format as '15079/wassily-kandinsky'

    * Search artist name at [artprice.com](https://www.artprice.com/search/artists) to get code from address bar

    B. Starting date of auction

    C. Select category

3.  __Authorize__

    At the first run, it prompts you to authorize access with Google account and automatically get token.json file. 

    * Make sure you sign in the account with permission to the specified Google spreadsheet, and Google Cloud Console API if you set the app as testing status.
  
    Results will be shown at the designated google sheet.

