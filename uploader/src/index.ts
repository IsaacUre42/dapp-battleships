import { SecretNetworkClient, Wallet } from "secretjs";
import * as dotenv from "dotenv";

dotenv.config();  // Load environment variables from .env file
const mnemonic = process.env.MNEMONIC;  // Retrieve the mnemonic
const endpoint = process.env.SECRET_REST_URL || "http://localhost:1317";
const chainId = process.env.CHAIN_ID || "secretdev-1";
const wallet = new Wallet(mnemonic);

// create a new client for the Pulsar testnet
const secretjs = new SecretNetworkClient({
    chainId: chainId,
    url: endpoint,
    wallet: wallet,
    walletAddress: wallet.address,
});

export const main = async (): Promise<void> => {
    const response = await secretjs.query.bank.balance(
        {
            address: secretjs.address,
            denom: "uscrt",
        }
    );
    console.log(response);
}

main()
