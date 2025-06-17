use cosmwasm_std::{entry_point, to_binary, Addr, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, OwnedDeps, Response, StdResult, Uint128};

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, GameResponse, GamesListResponse, InstantiateMsg, PlayerStatsResponse, QueryMsg, ShipPosition, ShotResponse, ShotResult};
use crate::state::{Config, Game, PlayerStats, CONFIG, GAMES, PLAYER_STATS};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let config = Config {
        next_game_id: 1,
        total_games: 0,
    };
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateGame {
            entry_fee,
            ship_positions
        } => {
            execute_create_game(deps, env, info, entry_fee, ship_positions)
        }
        ExecuteMsg::FireShot { game_id, x, y } => {
            execute_fire_shots(deps, env, info, game_id, x, y)
        }
        ExecuteMsg::PeekShots { game_id, num_shots } => {
            execute_peek_shots(deps, info, game_id, num_shots)
        }
        ExecuteMsg::ClaimWinnings { game_id } => {
            execute_claim_winnings(deps, info, game_id)
        }
    }
}

fn execute_create_game(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    entry_fee: Uint128,
    ship_positions: Vec<ShipPosition>
) -> Result<Response, ContractError> {
    validate_ship_positions(&ship_positions)?;

    let total_rewards: u128 = ship_positions
        .iter()
        .map(|pos| pos.ship_type.reward().u128())
        .sum();

    let paid_amount = info
        .funds
        .iter()
        .find(|coin| coin.denom == "uscrt")
        .map(|coin| coin.amount.u128())
        .unwrap_or(0);

    if paid_amount < total_rewards {
        return Err(ContractError::InsufficientFunds {});
    }

    let mut config = CONFIG.load(deps.storage)?;
    let game_id = config.next_game_id;
    config.next_game_id += 1;
    config.total_games += 1;
    CONFIG.save(deps.storage, &config)?;

    let game = Game::new(
        game_id,
        info.sender.clone(),
        entry_fee,
        ship_positions,
        env.block.time.seconds(),
    );

    GAMES.insert(deps.storage, &game_id, &game)?;

    let creator_key = info.sender.to_string();
    let mut stats = PLAYER_STATS
        .get(deps.storage, &creator_key)
        .unwrap_or_default();
    stats.games_created += 1;
    PLAYER_STATS.insert(deps.storage, &creator_key, &stats)?;

    Ok(Response::new()
        .add_attribute("method", "create_game")
        .add_attribute("game_id", game_id.to_string())
        .add_attribute("creator", info.sender.to_string()))
}

fn execute_fire_shots(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    game_id: u64,
    x: u8,
    y: u8
) -> Result<Response, ContractError> {
    let mut game = GAMES
        .get(deps.storage, &game_id)
        .ok_or(ContractError::GameNotFound {})?;

    if !game.is_coordinate_valid(x,y) {
        return Err(ContractError::InvalidCoordinates {});
    }

    if game.has_been_shot(x,y) {
        return Err(ContractError::InvalidCoordinates {})
    }

    let shot_cost = game.calculate_shot_cost();
    let paid_amount = info
        .funds
        .iter()
        .find(|coin| coin.denom == "uscrt")
        .map(|coin| coin.amount.u128())
        .unwrap_or(0);

    if paid_amount < shot_cost.u128() {
        return Err(ContractError::InsufficientFunds {});
    }

    let result = game.process_shot(x, y, info.sender.clone(), env.block.time.seconds());

    let player_key = info.sender.to_string();
    let mut stats = PLAYER_STATS
        .get(deps.storage, &player_key)
        .unwrap_or_default();
    stats.shots_fired += 1;
    stats.tokens_spent += shot_cost;

    let mut response = Response::new()
        .add_attribute("method", "fire_shot")
        .add_attribute("game_id", game_id.to_string())
        .add_attribute("coordinates", format!("{},{}", x,y))
        .add_attribute("result", format!("{:?}", result));

    if let ShotResult::Sunk {reward, ..} = &result {
        stats.ships_sunk += 1;
        stats.tokens_won += reward;

        let reward_msg = BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: vec![Coin {
                denom: "uscrt".to_string(),
                amount: *reward,
            }],
        };
        response = response.add_message(reward_msg);
    }

    GAMES.insert(deps.storage, &game_id, &game)?;
    PLAYER_STATS.insert(deps.storage, &player_key, &stats)?;

    Ok(response)
}

fn execute_peek_shots(deps: DepsMut, 
                      info: MessageInfo, 
                      game_id: u64, 
                      num_shots: u8
) -> Result<Response, ContractError> {
    let game = GAMES
        .get(deps.storage, &game_id)
        .ok_or(ContractError::GameNotFound {})?;
    
    let peek_cost = Uint128::new(2u128 * num_shots as u128);
    let paid_amount = info
        .funds
        .iter()
        .find(|coin| coin.denom == "uscrt")
        .map(|coin| coin.amount.u128())
        .unwrap_or(0);
    
    if paid_amount < peek_cost.u128() {
        return Err(ContractError::InsufficientFunds {});
    }
    
    let creator_payment = BankMsg::Send {
        to_address: game.creator.to_string(),
        amount: vec![Coin {
            denom: "uscrt".to_string(),
            amount: peek_cost,
        }]
    };
    
    Ok(Response::new()
        .add_message(creator_payment)
        .add_attribute("method", "peek_shots")
        .add_attribute("game_id", game.id.to_string())
        .add_attribute("num_shots", num_shots.to_string()))
}

fn execute_claim_winnings(
    deps: DepsMut,
    info: MessageInfo,
    game_id: u64,
) -> Result<Response, ContractError> {
    let game = GAMES
        .get(deps.storage, &game_id)
        .ok_or(ContractError::GameNotFound {})?;
    
    if info.sender != game.creator {
        return Err(ContractError::Unauthorized {});
    }
    
    //TODO: Game is either expired or finished
    
    Ok(Response::new()
        .add_attribute("method", "claim_winnings")
        .add_attribute("game_id", game_id.to_string()))
}


#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetGame { game_id } => to_binary(&query_game(deps, game_id)?),
        QueryMsg::GetGamesList {} => to_binary(&query_games_list(deps)?),
        QueryMsg::GetShot { game_id, x, y } => to_binary(&query_shot(deps, game_id, x, y)?),
        QueryMsg::GetPlayerStats { player } => to_binary(&query_player_stats(deps, player)?),
    }
}

fn query_game(deps: Deps, game_id: u64) -> StdResult<GameResponse> {
    let game = GAMES
        .get(deps.storage, &game_id)
        .ok_or_else(|| cosmwasm_std::StdError::not_found("Game not found"))?;

    let ships_remaining = game.ships_remaining();
    let next_shot_cost = game.calculate_shot_cost();

    Ok(GameResponse {
        id: game.id,
        creator: game.creator,
        entry_fee: game.entry_fee,
        total_pot: game.total_pot,
        status: game.status,
        grid_size: game.grid_size,
        shots_fired: game.shots.len() as u64,
        ships_remaining,
        next_shot_cost,
    })
}

fn query_games_list(deps: Deps) -> StdResult<GamesListResponse> {
    let config = CONFIG.load(deps.storage)?;
    let mut games = Vec::new();

    let start_id = if config.next_game_id > 10 {
        config.next_game_id - 10
    } else {
        1
    };

    for id in start_id..config.next_game_id {
        if let Some(game) = GAMES.get(deps.storage, &id) {
            let ships_remaining = game.ships_remaining();
            let next_shot_cost = game.calculate_shot_cost();
            games.push(GameResponse {
                id: game.id,
                creator: game.creator,
                entry_fee: game.entry_fee,
                total_pot: game.total_pot,
                status: game.status,
                grid_size: game.grid_size,
                shots_fired: game.shots.len() as u64,
                ships_remaining,
                next_shot_cost,
            });
        }
    }
    Ok(GamesListResponse {games})
}

fn query_shot(deps: Deps, game_id: u64, x: u8, y: u8) -> StdResult<ShotResponse> {
    let game = GAMES
        .get(deps.storage, &game_id)
        .ok_or_else(|| cosmwasm_std::StdError::not_found("Game not found"))?;
    
    let shot = game
        .shots
        .iter()
        .find(|shot| shot.x == x && shot.y == y)
        .ok_or_else(|| cosmwasm_std::StdError::not_found("Shot not found"))?;
    
    Ok(ShotResponse {
        result: shot.result.clone(),
        cost: shot.cost,
        timestamp: shot.timestamp,
        shooter: shot.shooter.clone(),
    })
}

fn query_player_stats(deps: Deps, player: String) -> StdResult<PlayerStatsResponse> {
    let stats = PLAYER_STATS.get(deps.storage, &player).unwrap_or_default();
    
    Ok(PlayerStatsResponse {
        games_created: stats.games_created,
        shots_fired: stats.shots_fired,
        ships_sunk: stats.ships_sunk,
        tokens_won: stats.tokens_won,
        tokens_spent: stats.tokens_spent
    })
}

fn validate_ship_positions(
    positions: &[ShipPosition],
) -> Result<(), ContractError> {
    if positions.len() != 3 {
        return Err(ContractError::InvalidCoordinates {});
    }
    
    for pos in positions {
        let length = pos.ship_type.length();
        let (end_x, end_y) = if pos.is_horizontal {
            (pos.start_x + length - 1, pos.start_y)
        } else {
            (pos.start_x, pos.start_y + length - 1)
        };
        
        if end_x >= 10 || end_y >= 10 {
            return Err(ContractError::InvalidCoordinates {});
        }
    }
    
    //TODO overlap detection
    
    Ok(())
}