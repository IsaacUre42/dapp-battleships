use cosmwasm_std::{Addr, CanonicalAddr, Timestamp};
use schemars::{JsonSchema};
use secret_toolkit::storage::{Item, Keymap};
use serde::{Deserialize, Serialize};

pub const GAMES: Keymap<u128, Game> = Keymap::new(b"game");
pub const NEXT_ID: Item<u128> = Item::new(b"next_id");
pub const LAST_ACTIVE_ID: Item<u128> = Item::new(b"last_active");

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Game {
    pub id: u128,
    pub owner: Addr,
    pub name: String,
    pub size: u8,
    pub shots: Vec<Shot>,
    pub completed: bool,
    pub ships: Vec<Ship>,
    pub created: Timestamp,
    pub creation_cost: u128,
    pub winnings_collected: bool,
    pub total_pot: u128
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Shot {
    pub x: u8,
    pub y: u8,
    pub shooter: Addr,
    pub cost: u128,
    pub reward: u128,
    pub sunk: bool,
    pub hit: bool,
    pub time: Timestamp
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Ship {
    pub x: u8,
    pub y: u8,
    pub length: u8,
    pub reward: u128,
    pub tiles: Vec<Pos>,
    pub is_horizontal: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Pos {
    pub x: u8,
    pub y: u8,
}