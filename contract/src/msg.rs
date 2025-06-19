use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use crate::state::Pos;

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateGame {
        size: u8,
        ships: Vec<ShipConstructor>,
        name: String
    },
    TakeShot {
        game_id: u128,
        x: u8,
        y: u8,
    },
    CollectWinnings {
        game_id: u128
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct ShipConstructor {
    pub position: Pos,
    pub length: u8,
    pub is_horizontal: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    Game {
        game_id: u128
    },
    AllGames {}
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryAnswer {
    Game {
        game_id: u128,
        size: u8,
        total_reward: u128,
        shots_taken: Vec<ShotFired>,
        name: String,
        ships: Vec<u8>
    },
    AllGames {
        ids: Vec<u128>
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct ShotFired {
    pub(crate) position: Pos,
    pub(crate) hit: bool
}