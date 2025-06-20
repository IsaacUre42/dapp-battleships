## Secret Token Battleships

### Setup:
_Working on linux_ 

In the contract directory, run: \
`make build-mainnet-reproducible`

Then, in the uploader directory, first create an .env file with the following fields:
 - MNEMONIC="your mnemonic"
 - SECRET_REST_URL="https://pulsar.lcd.secretnodes.com"
 - CHAIN_ID="pulsar-3"


`npm run build` \
`npm run upload` \
`npm run instantiate <chain id> <contract hash>` 

For convenience, in the frontend root directory, create a .env file such as the following, filling out the fields as appropriate:
```
VITE_CODE_ID = ""
VITE_CONTRACT_HASH = ""
VITE_CONTRACT_ADDRESS = ""
VITE_MNEMONIC=""
VITE_SECRET_REST_URL="https://pulsar.lcd.secretnodes.com"
VITE_CHAIN_ID="pulsar-3"
```

Then, in the frontend directory, run:
`npm run dev`

Navigate the site from the url in the terminal. \
Note that to explore all functionality, multiple users will be required to play games made by other people.