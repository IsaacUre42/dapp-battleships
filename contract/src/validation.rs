use std::collections::HashSet;
use cosmwasm_std::{Addr, Coin, StdError};
use crate::msg::ShipConstructor;
use crate::state::{Game, Ship};

pub fn validate_ships(size: u8, ships: Vec<ShipConstructor>) -> bool {
    for ship in ships {
        if ship.is_horizontal {
            if !(ship.position.x + ship.length <= size && ship.position.y <= size) {return false}
        } else {
            if !(ship.position.y + ship.length <= size && ship.position.x <= size) {return false}
        }
    }
    true
}

pub fn validate_ships_not_overlapping(ships: Vec<Ship>) -> bool {
    let mut seen = HashSet::new();
    for ship in ships {
        for tile in ship.tiles {
            if !seen.insert((tile.x, tile.y)) {
                // Duplicate tile found
                return false;
            }
        }
    }
    true
}

pub fn validate_funds(funds: Vec<Coin>, required: u128) -> Result<(), StdError> {
    // make sure some funds were sent
    if funds.len() < 1 {
        return Err(StdError::generic_err("No funds sent"));
    }
    // make sure the funds sent were SCRT (`uscrt` stands for micro-SCRT)
    if funds[0].denom != "uscrt" {
        return Err(StdError::generic_err("Bid not SCRT"));
    }
    // make sure there's enough money (don't care if they sent too much lol)
    if funds[0].amount.u128() < required {
        return Err(StdError::generic_err("Not enough funds"));
    }

    Ok(())
}

pub fn validate_shot(x: u8, y: u8, game: &Game, sender: &Addr) -> Result<(), StdError>{
    if (&game.owner == sender) {return Err(StdError::generic_err("Owner cannot shoot"));}
    let size = game.size;
    if !(x < size && y < size) {return Err(StdError::generic_err("invalid shot location"));}

    if game.shots.iter().any(|shot| shot.x == x && shot.y == y) {
        return Err(StdError::generic_err("Shot already taken at this location"));
    }

    Ok(())
}