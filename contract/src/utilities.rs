use cosmwasm_std::{Deps, DepsMut, Env, StdError};
use crate::msg::ShipConstructor;
use crate::state::{Game, Pos, Ship, Shot, GAMES};

pub fn generate_real_ships(ships: Vec<ShipConstructor>) -> Vec<Ship> {
    let mut constructed_ships: Vec<Ship> = vec![];
    for ship in ships {
        let mut tiles: Vec<Pos> = vec![];
        let length = ship.length;
        if ship.is_horizontal {
            for i in 0..length {
                tiles.push(Pos { x: ship.position.x + i, y: ship.position.y });
            }
        } else {
            for i in 0..length {
                tiles.push(Pos { x: ship.position.x, y: ship.position.y + i });
            }
        }
        let new_ship = Ship {
            x: ship.position.x,
            y: ship.position.y,
            length: ship.length,
            reward: (ship.length * 10) as u128,
            tiles,
            is_horizontal: ship.is_horizontal,
        };
        constructed_ships.push(new_ship);
    }

    constructed_ships
}


pub fn get_game(game_id: u128, deps: Deps) -> Result<Game, StdError> {
    let game = GAMES.get(deps.storage, &game_id);
    let game = match game {
        None => return Err(StdError::not_found("game not found")),
        Some(game) => game,
    };
    Ok(game)
}

pub fn check_shot(mut shot: Shot, game: &Game) -> Shot {
    for ship in &game.ships {
        if ship.tiles.iter().any(|tile| tile.x == shot.x && tile.y == shot.y) {
            // Check if all tiles of the ship have been shot (including this one)
            let all_hit = ship.tiles.iter().all(|tile| {
                game.shots.iter().any(|s| s.x == tile.x && s.y == tile.y)
                    || (tile.x == shot.x && tile.y == shot.y)
            });
            if all_hit {
                shot.sunk = true;
                shot.reward = ship.reward;
            } else {
                shot.sunk = false;
                shot.reward = 0;
            }
            return shot;
        }
    }
    // Miss
    shot.sunk = false;
    shot.reward = 0;
    shot
}