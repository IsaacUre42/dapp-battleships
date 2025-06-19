use cosmwasm_std::{entry_point, to_binary, Addr, BankMsg, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult, Timestamp};
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryAnswer, QueryMsg, ShipConstructor};
use crate::state::{Game, Shot, GAMES, NEXT_ID};
use crate::utilities::{check_shot, generate_real_ships, get_game};
use crate::validation::{validate_funds, validate_ships, validate_ships_not_overlapping, validate_shot};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg
) -> StdResult<Response> {
    // set the first id to 1
    let next_id: u128 = 1;
    NEXT_ID.save(deps.storage, &next_id)?;
    Ok(Response::default())
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::CreateGame { size, ships } => {
            try_make_game(deps, env, info.sender, info.funds, size, ships)
        }
        ExecuteMsg::TakeShot { game_id, x, y } => {
            try_take_shot(deps, env, info.sender, info.funds, game_id, x, y)
        }
        ExecuteMsg::CollectWinnings { game_id } => {
            try_collect_winnings(deps, env, info.sender, game_id)
        }
    }
}



pub fn try_make_game(
    deps: DepsMut,
    env: Env,
    sender: Addr,
    funds: Vec<Coin>,
    size: u8,
    ships: Vec<ShipConstructor>
) -> StdResult<Response> {

    // Get the id and increment it
    let id = NEXT_ID.load(deps.storage)?;
    NEXT_ID.save(deps.storage, &(id + 1))?;

    if !(validate_ships(size, ships.clone())) {return Err(StdError::generic_err("Invalid ship placement"));}
    let real_ships = generate_real_ships(ships);
    if !(validate_ships_not_overlapping(real_ships.clone())) {return Err(StdError::generic_err("Invalid ship placement"));}

    let sum_length_ships: u128 = real_ships.iter().map(|s| s.length as u128).sum();
    let cost = ((size as u128).pow(2) - sum_length_ships) + 10;

    validate_funds(funds, cost)?;

    let game = Game {
        id,
        owner: sender,
        size,
        shots: vec![],
        completed: false,
        ships: real_ships,
        created: env.block.time,
        creation_cost: cost,
        winnings_collected: false,
        total_pot: cost,
    };

    GAMES.insert(deps.storage, &id, &game)?;

    let res = Response::new().add_attribute("game_id", id.to_string());
    Ok(res)
}

pub fn try_take_shot(
    mut deps: DepsMut,
    env:  Env,
    sender: Addr,
    funds: Vec<Coin>,
    game_id: u128,
    x: u8,
    y: u8,
) -> StdResult<Response> {
    const REQUIRED_FUNDS: u128 = 10; // Cost to take a shot
    
    // Validation
    let mut game = get_game(game_id, deps.as_ref())?;
    validate_funds(funds, REQUIRED_FUNDS)?;
    validate_shot(x, y, &game, &sender)?;
    
    // Create the shot and check the outcome
    let shot = Shot {
        x,
        y,
        shooter: sender.clone(),
        cost: REQUIRED_FUNDS,
        reward: 0,
        sunk: false,
        time: env.block.time,
    };
    let shot = check_shot(shot, &game);

    // Update the pot accordingly and store the shot info
    game.total_pot = game.total_pot + REQUIRED_FUNDS - shot.reward;
    game.shots.push(shot.clone());
    
    GAMES.insert(deps.storage, &game_id, &game)?;

    let mut res = Response::default();
    
    // Return any winnings
    if shot.reward > 0 {
        let send_msg = BankMsg::Send {
            to_address: sender.to_string(),
            amount: vec![Coin {
                denom: "uscrt".to_string(),
                amount: shot.reward.into(),
            }]
        };
        res = res.add_message(send_msg);
    }

    Ok(res)
}

pub fn try_collect_winnings(
    deps: DepsMut,
    env: Env,
    sender: Addr,
    game_id: u128
) -> StdResult<Response> {
    let game = get_game(game_id, deps.as_ref())?;

    if game.owner != sender {
        return Err(StdError::generic_err("not authorized"))
    }

    Ok(Response::default())
}

#[entry_point]
pub fn query(
    deps: Deps,
    env: Env,
    msg: QueryMsg
) -> StdResult<Binary> {
    match msg {
        QueryMsg::Game { game_id } => {
            query_game(deps, env, game_id)
        }
    }
}

fn query_game(
    deps: Deps,
    env: Env,
    game_id: u128
) -> StdResult<Binary> {
    let game = get_game(game_id, deps)?;

    Ok(
        to_binary(&QueryAnswer::Game {
            game_id,
            size: game.size,
            total_reward: game.creation_cost,
            shots_taken: game.shots.len() as u128,
            owner: "".to_string(),
            ships: vec![],
        })?
    )
}