
# Interaktion admin tool


## How to run the app

- install node
- npm install
- copy template.env to .env, and update vars appropriately,
- npm start -> to start dev server (fetches changes in source code), leave it running while coding
- make code changes & test in dev server
- npm run build -> generates bundled code & css to be served by the server
- npm run start:prod -> to start server testing the prod version
- commit & push

## Recommendations

#### Use Visual studio code and install the following extensions:

- DotENV
- Node modules resolve
- npm Intellisense
- Path Intellisense
- Rainbow Brackets
- Code Spell Checker
- EditorConfig for VS Code
- ESLint

*The last 2 are necessary to ensure line breaks are LF, and eslint lets you compile*

## Environment variables

### Fine in template.env
- APP_NAME
- APP_ADMIN_PATH
- PARSE_PATH
- PARSE_APPID
- PARSE_DASHBOARD_PASS

### Preferably on the environment of each server:
- APP_URL
- APP_PORT
- PARSE_MASTER_KEY
- PARSE_STORAGE
- EMAIL_SENDER
- EMAIL_USER
- EMAIL_PASSWORD
- EMAIL_HOST
- EMAIL_PORT
- APP_LOGO_URL
- APP_FAVICON_URL
- APP_CURRENCY
- APP_LOCALE


--TODO---
- Update libs
- replace requires for imports
- check email work.
- Multi-language support
- Multi-image support.
