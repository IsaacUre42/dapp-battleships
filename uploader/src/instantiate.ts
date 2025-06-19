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

const instantiateContract = async (codeId: string, contractCodeHash: string): Promise<string> => {
    // The instantiate message is empty in this example.
    // We could also send an `admin` address if we wanted to.

    const initMsg = {};
    // const initMsg = {
    //     admin: wallet.address
    // };
    let tx = await secretjs.tx.compute.instantiateContract(
        {
            code_id: codeId,
            sender: wallet.address,
            code_hash: contractCodeHash,
            init_msg: initMsg,
            label: "test contract" + Math.ceil(Math.random() * 10000000),
        },
        {
            gasLimit: 400_000,
        }
    );

    //Find the contract_address in the logs
    //@ts-ignore
    const contractAddress = tx.arrayLog!.find((log) => log.type === "message" && log.key === "contract_address").value;

    return contractAddress;
};

export const main = async (): Promise<void> => {
    if (process.argv.length !== 4) {
        console.error('Expected two arguments!');
        process.exit(1);
    }

    let code_id = process.argv[2];
    let code_hash = process.argv[3];

    const contract_address = await instantiateContract(code_id, code_hash);

    console.log("Contract address: ", contract_address);
}

main()
