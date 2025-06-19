use cosmwasm_std::{Addr, CanonicalAddr, Timestamp};
use schemars::{JsonSchema};
use secret_toolkit::storage::{Item, Keymap};
use serde::{Deserialize, Serialize};

pub const PLAYERS: Keymap<CanonicalAddr, Player> = Keymap::new(b"players");
pub const GAMES: Keymap<u128, Game> = Keymap::new(b"game");
pub const NEXT_ID: Item<u128> = Item::new(b"next_id");


#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Player {
    pub address: Addr,
    pub name: String,
    pub games: Vec<u128>
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Game {
    pub id: u128,
    pub owner: Addr,
    pub size: u8,
    pub shots: Vec<Shot>,
    pub completed: bool,
    pub ships: Vec<Ship>,
    pub created: Timestamp,
    pub creation_cost: u128,
    pub winnings_collected: bool
}

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct Shot {
    pub id: u128,
    pub x: u8,
    pub y: u8,
    pub shooter: Addr,
    pub cost: u128,
    pub reward: u128,
    pub sunk: bool,
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
    x: u8,
    y: u8,
}