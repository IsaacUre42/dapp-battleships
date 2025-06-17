use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Game not found")]
    GameNotFound {},

    #[error("Invalid coordinates")]
    InvalidCoordinates {},

    #[error("Game already started")]
    GameAlreadyStarted {},

    #[error("Insufficient funds")]
    InsufficientFunds {},
}