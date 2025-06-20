import {SecretNetworkClient, Wallet,} from "secretjs";
import type {GameResponse, ShipConstructor, CreateGameRequest, AllGamesResponse} from "./battleship-types.ts";

export class BattleshipClient {
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

    isClientAddress(address: string): boolean {
        return address == this.wallet.address;
    }

    async makeGame(size: number, name: string, ships: Array<ShipConstructor>, cost: number) {

        let create_game_msg: CreateGameRequest = {
            create_game: {
                size,
                name,
                ships
            }
        }

        await this.client.tx.compute.executeContract(
            {
                sender: this.wallet.address,
                contract_address: this.contract_address,
                code_hash: this.code_hash,
                msg: create_game_msg,
                sent_funds: [
                    {
                        denom: "uscrt",
                        amount: cost.toString(),
                    },],
            },
            {
                gasLimit: 100_000,
            }
        );
    }

    async takeShot(game_id: string, x: number, y: number): Promise<{reward: number, error?: string}> {
        let take_shot_msg = {
            take_shot: {
                game_id,
                x,
                y,
            }
        };

        const take_shot_tx = await this.client.tx.compute.executeContract(
            {
                sender: this.wallet.address,
                contract_address: this.contract_address,
                code_hash: this.code_hash,
                msg: take_shot_msg,
                sent_funds: [
                    {
                        denom: "uscrt",
                        amount: "100000",
                    }
                ]
            },
            {
                gasLimit: 100_000,
            }
        );
        // Check for error in raw_log
        if (take_shot_tx.code !== 0) {
            return {reward: 0, error: "Shot Transaction Failed"};
        }

        let reward = this.checkShipSunkAndRewarded(take_shot_tx, this.wallet.address);
        return {reward};
    }

    checkShipSunkAndRewarded(txResponse: any, shooterAddress: string): number {
        let reward = 0;
        if (!txResponse?.events) return 0;

        for (const event of txResponse.events) {
            if (event.type === "coin_received") {
                let receiver = "";
                let amountStr = "";
                for (const attr of event.attributes) {
                    if (attr.key === "receiver") receiver = attr.value;
                    if (attr.key === "amount") amountStr = attr.value;
                }
                if (receiver === shooterAddress && amountStr.endsWith("uscrt")) {
                    reward = parseInt(amountStr.replace("uscrt", ""), 10);
                }
            }
        }
        // If reward > 0, assume ship sunk and coins earned
        return reward;
    }

    async getBalance(): Promise<number> {
        const res = await this.client.query.bank.balance({
            address: this.wallet.address,
            denom: "uscrt"
        });
        // Returns balance in micro-SCRT (uscrt), convert to SCRT
        if (!res.balance?.amount) {return -1}
        return parseInt(res.balance.amount, 10) / 1_000_000;
    }


    async collectWinnings(game_id: string): Promise<{reward: number, error?: string}> {
        let collection_msg = {
            collect_winnings: {
                game_id,
            }
        };

        const collect_winnings_tx = await this.client.tx.compute.executeContract(
            {
                sender: this.wallet.address,
                contract_address: this.contract_address,
                code_hash: this.code_hash,
                msg: collection_msg,
                sent_funds: []
            },
            {
                gasLimit: 100_000
            }
        );

        // Check for error in raw_log
        if (collect_winnings_tx.code !== 0) {
            return {reward: 0, error: "Collect winnings transaction failed"};
        }

        // Parse reward from events
        let reward = 0;
        if (collect_winnings_tx.events) {
            for (const event of collect_winnings_tx.events) {
                if (event.type === "coin_received") {
                    let receiver = "";
                    let amountStr = "";
                    if (!event.attributes) break;
                    for (const attr of event.attributes) {
                        if (!attr.value) break;
                        if (attr.key === "receiver") receiver = attr.value;
                        if (attr.key === "amount") amountStr = attr.value;
                    }
                    if (receiver === this.wallet.address && amountStr.endsWith("uscrt")) {
                        reward += parseInt(amountStr.replace("uscrt", ""), 10);
                    }
                }
            }
        }

        return {reward};
    }

    async queryGame(game_id: number): Promise<GameResponse> {
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

        const gameResponse = game_query as GameResponse;
        return gameResponse;
    }

    async queryAllGameIds(): Promise<AllGamesResponse> {
        let query_msg = {
            all_games: {}
        }

        const all_games_query = await this.client.query.compute.queryContract({
            contract_address: this.contract_address,
            code_hash: this.code_hash,
            query: query_msg
        });

        const all_games_response = all_games_query as AllGamesResponse;
        return all_games_response;
    }

    async getAllGames(): Promise<GameResponse[]> {
        const allGamesResponse = await this.queryAllGameIds();
        const ids = allGamesResponse.all_games.ids;
        const games = await Promise.all(
            ids.map(id => this.queryGame(Number(id)))
        );
        return games;
    }

}