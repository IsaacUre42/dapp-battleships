import { SecretNetworkClient, Wallet } from "secretjs";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();  // Load environment variables from .env file

const mnemonic = process.env.MNEMONIC;  // Retrieve the mnemonic
const endpoint = process.env.SECRET_REST_URL || "http://localhost:1317";
const chainId = process.env.CHAIN_ID || "secretdev-1";

console.log(mnemonic);
// Add validation for mnemonic
if (!mnemonic) {
    console.error("Error: MNEMONIC environment variable is not set");
    process.exit(1);
}

const wallet = new Wallet(mnemonic);

// create a new client for the Pulsar testnet
const secretjs = new SecretNetworkClient({
    chainId: chainId,
    url: endpoint,
    wallet: wallet,
    walletAddress: wallet.address,
});

const uploadContract = async (contract_wasm: Buffer): Promise<{code_id: string, code_hash?: string}> => {
    try {
        console.log("Uploading contract...");
        let tx = await secretjs.tx.compute.storeCode(
            {
                sender: wallet.address,
                wasm_byte_code: contract_wasm,
                source: "",
                builder: "",
            },
            {
                gasLimit: 4_000_000,
            }
        );

        console.log("Transaction result:", tx);

        // Better error handling for finding code_id
        const codeIdLog = tx.arrayLog?.find((log) => log.type === "message" && log.key === "code_id");
        if (!codeIdLog) {
            throw new Error("Could not find code_id in transaction logs");
        }

        //@ts-ignore
        const codeId = codeIdLog.value;
        console.log("codeId: ", codeId);

        const contractCodeHash = (
            await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
        ).code_hash;
        console.log(`Contract hash: ${contractCodeHash}`);

        return {
            code_id: codeId,
            code_hash: contractCodeHash,
        };
    } catch (error) {
        console.error("Error uploading contract:", error);
        throw error; // Re-throw to be handled by caller
    }
};

export const main = async (): Promise<void> => {
    try {
        // Check if contract file exists
        const contractPath = "/mnt/BigBoy/Code/dapp-battleships/contract/contract.wasm.gz";
        if (!fs.existsSync(contractPath)) {
            throw new Error(`Contract file not found: ${contractPath}`);
        }

        console.log("Reading contract file...");
        const contractWasm = fs.readFileSync(contractPath);
        console.log(`Contract file size: ${contractWasm.length} bytes`);

        const { code_id, code_hash } = await uploadContract(contractWasm);
        console.log("✅ Upload successful!");
        console.log("Code ID: ", code_id);
        console.log("Code hash: ", code_hash);
    } catch (error) {
        console.error("❌ Upload failed:", error);
        throw error; // Re-throw to be handled by the main catch
    }
};

// Add proper error handling for the main function call
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
