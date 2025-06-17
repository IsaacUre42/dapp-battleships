use cosmwasm_std::{Addr, Uint128};
use schemars::JsonSchema;
use secret_toolkit::storage::{Item, Keymap};
use serde::{Deserialize, Serialize};
use crate::msg::{GameStatus, ShipPosition, ShipType, ShotResult};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub next_game_id: u64,
    pub total_games: u64,
}

pub const CONFIG: Item<Config> = Item::new(b"config");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Game {
    pub id: u64,
    pub creator: Addr,
    pub entry_fee: Uint128,
    pub total_pot: Uint128,
    pub status: GameStatus,
    pub grid_size: u8,
    pub ships: Vec<Ship>,
    pub shots: Vec<Shot>,
    pub created_at: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Ship {
    pub ship_type: ShipType,
    pub positions: Vec<Position>,
    pub hits: Vec<bool>,
    pub is_sunk: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Position {
    pub x: u8,
    pub y: u8,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Shot {
    pub x: u8,
    pub y: u8,
    pub shooter: Addr,
    pub result: ShotResult,
    pub cost: Uint128,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[derive(Default)]
pub struct PlayerStats {
    pub games_created: u64,
    pub shots_fired: u64,
    pub ships_sunk: u64,
    pub tokens_won: Uint128,
    pub tokens_spent: Uint128,
}

pub const GAMES: Keymap<u64, Game> = Keymap::new(b"games");
pub const PLAYER_STATS: Keymap<String, PlayerStats> = Keymap::new(b"player_stats");

impl Game {
    pub fn new(
        id: u64,
        creator: Addr,
        entry_fee: Uint128,
        ship_positions: Vec<ShipPosition>,
        timestamp: u64,
    ) -> Self {
        let ships: Vec<Ship> = ship_positions
            .into_iter()
            .map(|pos| Ship::from_position(pos))
            .collect();
        
        let total_reward: u128 = ships
            .iter()
            .map(|ship| ship.ship_type.reward().u128())
            .sum();
        
        Self {
            id,
            creator,
            entry_fee,
            total_pot: Uint128::new(total_reward),
            status: GameStatus::Active,
            grid_size: 10,
            ships,
            shots: vec![],
            created_at: timestamp,
        }
    }
    
    pub fn calculate_shot_cost(&self) -> Uint128 {
        let shot_number = self.shots.len() as u32;
        Uint128::new(2_u128.pow(shot_number.min(10)))
    }
    
    pub fn is_coordinate_valid(&self, x: u8, y: u8) -> bool {
        x < self.grid_size && y < self.grid_size
    }
    
    pub fn has_been_shot(&self, x: u8, y: u8) -> bool {
        self.shots.iter().any(|shot| shot.x == x && shot.y == y)
    }
    
    pub fn process_shot(&mut self, x: u8, y: u8, shooter: Addr, timestamp: u64) -> ShotResult {
        let cost = self.calculate_shot_cost();
        
        let mut result = ShotResult::Miss;
        
        for ship in &mut self.ships {
            if let Some(pos_index) = ship.positions.iter().position(|pos| pos.x == x && pos.y == y) {
                ship.hits[pos_index] = true;
                
                if ship.hits.iter().all(|&hit| hit) && !ship.is_sunk {
                    ship.is_sunk = true;
                    result = ShotResult::Sunk {
                        ship_type: ship.ship_type.clone(),
                        reward: ship.ship_type.reward(),
                    };
                } else {
                    result = ShotResult::Hit;
                }
                break;
            }
        }
        
        let shot = Shot {
            x, 
            y,
            shooter,
            result: result.clone(),
            cost,
            timestamp,
        };
        self.shots.push(shot);
        
        if self.ships.iter().all(|ship| ship.is_sunk)  {
            self.status = GameStatus::Completed;
        }
        
        result
    }
    
    pub fn ships_remaining(&self) -> u8 {
        self.ships.iter().filter(|ship| !ship.is_sunk).count() as u8
    }
}

impl Ship {
    pub fn from_position(pos: ShipPosition) -> Self {
        let mut positions = Vec::new();
        let length = pos.ship_type.length();
        
        for i in 0..length {
            let (x,y) = if pos.is_horizontal {
                (pos.start_x + i, pos.start_y)
            } else {
                (pos.start_x, pos.start_y + i)
            };
            positions.push(Position {x,y});
        }
        
        Self {
            ship_type: pos.ship_type,
            positions,
            hits: vec![false; length as usize],
            is_sunk: false,
        }
    }
}