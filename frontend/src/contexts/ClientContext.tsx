import { createContext, useContext } from "react";
import type { BattleshipClient } from "../utils/BattleshipClient";

export const ClientContext = createContext<BattleshipClient | null>(null);
export const useClient = () => useContext(ClientContext);