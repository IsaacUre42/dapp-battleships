export interface GameResponse {
    game: {
        game_id: string,
        size: number,
        total_reward: string,
        shots_taken: Array<ShotFired>,
        name: string,
        ships: Array<{length: number, sunk: boolean}>,
        owner: string,
        completed: boolean,
        reward_collected: boolean
    }
}

export interface ShotFired {
    position: {x: number, y: number},
    hit: boolean,
}

export interface AllGamesResponse {
    all_games: {
        ids: Array<string>
    }
}

export interface CreateGameRequest {
    create_game: {
        size: number,
        name: string,
        ships: Array<ShipConstructor>
    }
}

export interface ShipConstructor {
    position: {x: number, y: number},
    length: number,
    is_horizontal: boolean,
}