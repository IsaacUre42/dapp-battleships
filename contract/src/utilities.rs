use cosmwasm_std::{Deps, DepsMut, Env, StdError, StdResult};
use crate::msg::ShipConstructor;
use crate::state::{Game, Pos, Ship, Shot, GAMES, LAST_ACTIVE_ID, NEXT_ID};

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

pub fn update_last_active_id(deps: DepsMut, env: &Env) -> StdResult<()> {
    let last_active_id = LAST_ACTIVE_ID.load(deps.storage)?;
    let next_id = NEXT_ID.load(deps.storage)?;

    let mut oldest_active_id: Option<u128> = None;
    for id in last_active_id..next_id {
        if let Some(game) = GAMES.get(deps.storage, &id) {
            if is_game_active(&game, env) {
                oldest_active_id = Some(id);
                break;
            }
            if !game.completed {
                let mut updated = game.clone();
                updated.completed = true;
                GAMES.insert(deps.storage, &updated.id, &updated)?;
            }
        }
    }

    if let Some(id) = oldest_active_id {
        LAST_ACTIVE_ID.save(deps.storage, &id)?;
    }
    Ok(())
}

fn is_ship_sunk(ship: &Ship, shots: &[Shot]) -> bool {
    ship.tiles.iter().all(|tile| {
        shots.iter().any(|shot| shot.x == tile.x && shot.y == tile.y)
    })
}

pub fn is_game_active(game: &Game, env: &Env) -> bool {
    let all_sunk = game.ships.iter().all(|ship| is_ship_sunk(ship, &game.shots));
    let within_24h = env.block.time.seconds() < game.created.seconds() + 24 * 60 * 60;
    !all_sunk && within_24h && !game.completed
}

pub fn get_game(game_id: u128, deps: Deps) -> Result<Game, StdError> {
    let game = GAMES.get(deps.storage, &game_id);
    let game = match game {
        None => return Err(StdError::generic_err("game not found")),
        Some(game) => game,
    };
    Ok(game)
}

pub fn check_shot(mut shot: Shot, game: &Game) -> Shot {
    for ship in &game.ships {
        if ship.tiles.iter().any(|tile| tile.x == shot.x && tile.y == shot.y) {
            // Check if all tiles of the ship have been shot (including this one)
            shot.hit = true;
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