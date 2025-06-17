use cosmwasm_std::Addr;
use cosmwasm_std::Uint128;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateGame {
        entry_fee: Uint128,
        ship_positions: Vec<ShipPosition>
    },
    FireShot {
        game_id: u64,
        x: u8,
        y: u8,
    },
    PeekShots {
        game_id: u64,
        num_shots: u8,
    },
    ClaimWinnings {
        game_id: u64,
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetGame { game_id: u64 },
    GetGamesList {},
    GetShot { game_id: u64, x: u8, y: u8 },
    GetPlayerStats { player: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GameResponse {
    pub id: u64,
    pub creator: Addr,
    pub entry_fee: Uint128,
    pub total_pot: Uint128,
    pub status: GameStatus,
    pub grid_size: u8,
    pub shots_fired: u64,
    pub ships_remaining: u8,
    pub next_shot_cost: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ShotResponse {
    pub result: ShotResult,
    pub cost: Uint128,
    pub timestamp: u64,
    pub shooter: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GamesListResponse {
    pub games: Vec<GameResponse>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PlayerStatsResponse {
    pub games_created: u64,
    pub shots_fired: u64,
    pub ships_sunk: u64,
    pub tokens_won: Uint128,
    pub tokens_spent: Uint128
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ShipPosition {
    pub ship_type: ShipType,
    pub start_x: u8,
    pub start_y: u8,
    pub is_horizontal: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum ShipType {
    Destroyer,  // 2 cells, 10 tokens
    Cruiser,    // 3 cells, 25 tokens
    Battleship, // 4 cells, 50 tokens
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum GameStatus {
    Active,
    Completed,
    Abandoned,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum ShotResult {
    Miss,
    Hit,
    Sunk { ship_type: ShipType, reward: Uint128 },
}

impl ShipType {
    pub fn length(&self) -> u8 {
        match self {
            ShipType::Destroyer => 2,
            ShipType::Cruiser => 3,
            ShipType::Battleship => 4,
        }
    }

    pub fn reward(&self) -> Uint128 {
        match self {
            ShipType::Destroyer => Uint128::new(10),
            ShipType::Cruiser => Uint128::new(25),
            ShipType::Battleship => Uint128::new(50),
        }
    }
}