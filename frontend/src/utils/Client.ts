import {SecretNetworkClient, Wallet,} from "secretjs";
import {keys} from "@mantine/core";

export class Client {
    private client: SecretNetworkClient;
    private readonly contract_address: string;
    private readonly code_hash: string;
    private wallet: Wallet;
    
    constructor(client: SecretNetworkClient, contract_address: string, code_hash: string, wallet: Wallet) {
        this.client = client;
        this.contract_address = contract_address;
        this.code_hash = code_hash;
        this.wallet = wallet;
    }

    async makeGame(size: number) {

        let create_game_msg = {
            create_game: {
                size: size,
            }
        }

        const create_game_tx = await this.client.tx.compute.executeContract(
            {
                sender: this.wallet.address,
                contract_address: this.contract_address,
                code_hash: this.code_hash,
                msg: create_game_msg,
                sent_funds: [],
            },
            {
                gasLimit: 100_000,
            }
        );

        let game_id = null;
        try {
            // @ts-ignore
            game_id = create_game_tx.jsonLog?.find((event: any) => event.type === "wasm")?.attributes.find((attr: any) => attr.key === "game_id")?.value;
        } catch (e) {}
        console.log(game_id);
    }

    async queryGame(game_id: number) {
        let query_msg = {
            game: {
                game_id: game_id.toString(),
            }
        }

        const game_query = await this.client.query.compute.queryContract({
            contract_address: this.contract_address,
            code_hash: this.code_hash,
            query: query_msg,
        });

        console.log(game_query);
    }
}