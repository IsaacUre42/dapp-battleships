import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import App from "./components/App";
import Login from "./components/Login";
import { ClientContext } from "./contexts/ClientContext";
import type { BattleshipClient } from "./utils/BattleshipClient";
import ViewGame from "./components/ViewGame.tsx";
import {Notifications} from "@mantine/notifications";

function Root() {
    const [client, setClient] = useState<BattleshipClient | null>(null);

    return (
        <MantineProvider forceColorScheme={"dark"}>
            <Notifications position="top-left" withinPortal={false}/>
                <ClientContext.Provider value={client}>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Login setClient={setClient} />} />
                            <Route path="/app" element={client ? <App /> : <Login setClient={setClient} />} />
                            <Route path="/game/:gameId" element={<ViewGame />} />
                        </Routes>
                    </BrowserRouter>
                </ClientContext.Provider>
        </MantineProvider>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Root />
    </StrictMode>
);