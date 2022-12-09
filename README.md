# Expense manager

[![Continuous Build](https://github.com/Siegrift/expense-manager/actions/workflows/main.yml/badge.svg)](https://github.com/Siegrift/expense-manager/actions/workflows/main.yml)

A hobby project for tracking expenses and analyzing spendings. Transaction data is persisted on firebase server and is
**not** encrypted. If you have problems with this, consider forking and host using a custom firebase and separate Vercel
account.

## Run

1. Follow the [initial setup](#initial-setup) (needed only once)
2. Run `pnpm run dev`
3. (Optional) Run tests - `pnpm run test:unit:watch` and `pnpm run test:e2e:open`

## Initial setup

1. [Create a firebase project](#create-a-new-firebase-instance) for development. You can name it `expense manager - dev`
   or any other name you prefer.
2. Create credentials file - A credentials file is needed to connect the application to the firebase instance created in
   previous step. You need to create `.env-dev` file according to `.env-template`.
3. [Configure cloud storage CORS](#configure-cloud-storage-cors) - This is needed for firebase storage to work.
4. Create a `serviceAccount.json` - This file is needed for e2e tests. Follow
   [cypress-firebase setup](https://github.com/prescottprue/cypress-firebase#setup) for information on how to obtain it
   (only download the service account - no additional setup is required).
5. Install `node` and `pnpm`. See package.json for supported versions.
6. Run `pnpm install` to install project dependencies.

### Create a new firebase instance

We use firebase for user authentication, database and file storage. Follow the
[firebase web codelab](https://codelabs.developers.google.com/codelabs/firebase-web/#2) and adapt the naming of the
project accordingly.

### Configure cloud storage CORS

In order to download files from cloud storage from web you need to configure CORS. See the documentation here
https://firebase.google.com/docs/storage/web/download-files?authuser=0#cors_configuration.

We are using committed `cors.json` file for this matter. Make sure you are logged in. You can use `gcloud auth login` to
log in.

## Conventions and reminders

1. **Lower case filenames** - NextJs uses predefined routing _(pages directory is automatically routed)_ and the url
   name must match the page filename. I want URL parts _(e.g. /login)_ to be lowercased, and for consistency all files
   should start with lowercase.
2. **Desktop first, but mobile friendly** - The app is intended to work as a web app, but also as a PWA and should be
   mobile friendly. It also works in offline mode thanks to service worker and
   [firestore offline capabilities](https://firebase.google.com/docs/firestore/manage-data/enable-offline).

## Deployment

1. Download [vercel](https://vercel.com/cli) and create an account
2. Create new Firebase project according to Firebase integration section
3. Create `.env-prod` file with the same constants names as in `.env-template` and set Firebase constants to specific
   values from your Firebase project
4. Run `pnpm run deploy`

## Contribution

The project is open for contributions and feedback. Feel free to create an issue or a PR.

### Other tools

- [Trello board](https://trello.com/b/0WCaG9Go/expense-manager) - For issue tracking (access rights needed)
- [Cypress dashboard](https://dashboard.cypress.io/projects/4qffcg) - For debugging CI tests (access rights needed)
