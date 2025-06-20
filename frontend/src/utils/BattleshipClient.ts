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

    async makeGame(size: number, name: string, ships: Array<ShipConstructor>, cost: number) {

        let create_game_msg: CreateGameRequest = {
            create_game: {
                size,
                name,
                ships
            }
        }

        const create_game_tx = await this.client.tx.compute.executeContract(
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

        console.log(create_game_tx);
    }

    async takeShot(game_id: string, x: number, y: number) {
        let take_shot_msg = {
            take_shot: {
                game_id,
                x,
                y,
            }
        }

        const take_shot_tx = await this.client.tx.compute.executeContract(
            {
                sender: this.wallet.address,
                contract_address: this.contract_address,
                code_hash: this.code_hash,
                msg: take_shot_msg,
                sent_funds: [
                    {
                        denom: "uscrt",
                        amount: "10",
                    }]
            },
            {
                gasLimit: 100_000,
            }
        );

        console.log(take_shot_tx);
    }

    async collectWinnings(game_id: string) {
        let collection_msg = {
            collect_winnings: {
                game_id,
            }
        }

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
        )

        console.log(collect_winnings_tx);
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
        console.log(gameResponse);
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
        console.log(all_games_response);
        return all_games_response;
    }

    async getAllGames(): Promise<GameResponse[]> {
        const allGamesResponse = await this.queryAllGameIds();
        const ids = allGamesResponse.all_games.ids;
        const games = await Promise.all(
            ids.map(id => this.queryGame(Number(id)))
        );
        console.log(games);
        return games;
    }

}