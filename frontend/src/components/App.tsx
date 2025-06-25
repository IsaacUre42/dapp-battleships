import { useState, useEffect } from "react";
import {Button, Container, SimpleGrid, Card, Text, Title, Group, Loader, Modal, Radio, Badge} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import CreateGame from "./CreateGame";
import { useClient } from "../contexts/ClientContext";
import type { GameResponse } from "../utils/battleship-types";
import GameGridPreview from "./GameGridPreview.tsx";

const profiles = [
    // Formula: 500000 + (25000 * gridSize^2) - (25000 * totalShipsLengths)
    { name: "Classic", gridSize: 10, shipSizes: [2, 3, 4, 6], cost: 2625000 },
    { name: "Long Ships", gridSize: 12, shipSizes: [3, 4, 5, 7], cost: 3625000 },
    { name: "Mini", gridSize: 8, shipSizes: [2, 3, 4], cost: 1875000 },
];

function App() {
    const [page, setPage] = useState<"main" | "create">("main");
    const [games, setGames] = useState<GameResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(profiles[0]);
    const client = useClient();
    const navigate = useNavigate();

    useEffect(() => {
        if (client && page === "main") {
            setLoading(true);
            client.getAllGames()
                .then(setGames)
                .finally(() => setLoading(false));
        }
    }, [client, page]);

    if (!client) return null;

    if (page === "create") {
        return (
            <CreateGame
                gridSize={selectedProfile.gridSize}
                shipSizes={selectedProfile.shipSizes}
                cost={selectedProfile.cost}
                onCreated={() => setPage("main")}
            />
        );
    }

    return (
        <Container>
            <Group justify="space-between" mb="md" style={{ marginTop: 10 }}>
                <Title order={2}>Battleship Games</Title>
                <Button onClick={() => setModalOpen(true)}>Create Game</Button>
            </Group>
            <div
                style={{
                    height: "80vh", // Adjust as needed
                    overflowY: "auto",
                    marginBottom: 24,
                }}
            >
                {loading ? (
                    <Group justify="center" style={{ minHeight: 200 }}>
                        <Loader />
                    </Group>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                        {games.map(({ game }) => {
                            // Count sunk ships
                            const totalShips = Array.isArray(game.ships) ? game.ships.length : 0;
                            const sunkShips = Array.isArray(game.ships)
                                ? game.ships.filter((ship: any) => ship.sunk).length
                                : 0;
                            const shipsLeft = totalShips - sunkShips;

                            return (
                                <Card
                                    key={game.game_id}
                                    shadow="sm"
                                    padding="lg"
                                    radius="md"
                                    withBorder
                                    onClick={() => navigate(`/game/${game.game_id}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <GameGridPreview size={game.size} shots={game.shots_taken} width={game.size*10} height={game.size*10} />
                                    <Group justify="space-between" mt="md" mb="xs">
                                        <Text fw={800}>{game.name}</Text>
                                        {client.isClientAddress(game.owner) ?
                                            <Badge color={"green"}>Creator</Badge> : ""}
                                    </Group>
                                    <Text size="sm">Possible Winnings: {Number(game.total_reward) / 1_000_000} SCRT</Text>
                                    <Text size="sm">
                                        Ships Remaining: {shipsLeft} / {totalShips}
                                    </Text>
                                    <Text size="sm">Active: {game.completed ? "No" : "Yes"}</Text>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                )}
            </div>
            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Select Game Profile"
                centered
            >
                <Radio.Group
                    value={selectedProfile.name}
                    onChange={name => {
                        const profile = profiles.find(p => p.name === name);
                        if (profile) setSelectedProfile(profile);
                    }}
                >
                    <Group>
                        {profiles.map(profile => (
                            <Radio
                                key={profile.name}
                                value={profile.name}
                                label={`${profile.name} (Map: ${profile.gridSize}x${profile.gridSize}, Ships: ${profile.shipSizes.join(", ")}, Cost: ${(profile.cost / 1_000_000)} SCRT)`}
                            />
                        ))}
                    </Group>
                </Radio.Group>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button
                        color="green"
                        onClick={() => {
                            setModalOpen(false);
                            setPage("create");
                        }}
                    >
                        Continue
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}

export default App;