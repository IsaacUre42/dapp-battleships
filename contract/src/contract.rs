use cosmwasm_std::{entry_point, to_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult};
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryAnswer, QueryMsg};
use crate::state::{Game, GAMES, NEXT_ID};

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
        ExecuteMsg::CreateGame { size } => {
            try_make_game(deps, env, info.sender, size)
        }
        ExecuteMsg::TakeShot { game_id, x, y } => {
            try_take_shot(deps, env, info.sender, game_id, x, y)
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
    size: u8
) -> StdResult<Response> {

    // Get the id and increment it
    let id = NEXT_ID.load(deps.storage)?;
    NEXT_ID.save(deps.storage, &(id + 1))?;

    // TODO: Add ships

    let game = Game {
        id,
        owner: sender,
        size,
        shots: vec![],
        completed: false,
        ships: vec![],
        created: Default::default(),
        creation_cost: 0,
        winnings_collected: false,
    };

    GAMES.insert(deps.storage, &id, &game)?;
    
    let res = Response::new().add_attribute("game_id", id.to_string());
    Ok(res)
}

pub fn try_take_shot(
    deps: DepsMut,
    env:  Env,
    sender: Addr,
    game_id: u128,
    x: u8,
    y: u8
) -> StdResult<Response> {
    let game = GAMES.get(deps.storage, &game_id);
    let mut game = match game {
        None => return Err(StdError::not_found("game not found")),
        Some(game) => game,
    };
    
    //TODO validation
    
    Ok(Response::default())
}

pub fn try_collect_winnings(
    deps: DepsMut,
    env: Env,
    sender: Addr,
    game_id: u128
) -> StdResult<Response> {
    let game = GAMES.get(deps.storage, &game_id);
    let mut game = match game {
        None => return Err(StdError::not_found("game not found")),
        Some(game) => game,
    };
    
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
    let game = GAMES.get(deps.storage, &game_id);
    let mut game = match game {
        None => return Err(StdError::not_found("game not found")),
        Some(game) => game,
    };
    
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