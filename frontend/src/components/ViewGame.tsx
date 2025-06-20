import { useEffect, useState, useRef } from "react";
import {useNavigate, useParams} from "react-router-dom";
import { Button, Container, SimpleGrid, Title, Loader, Group } from "@mantine/core";
import { useClient } from "../contexts/ClientContext";
import type { GameResponse, ShotFired } from "../utils/battleship-types";
import { notifications } from "@mantine/notifications";

function ViewGame() {
    const { gameId } = useParams<{ gameId: string }>();
    const client = useClient();
    const navigate = useNavigate();
    const [game, setGame] = useState<GameResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [shooting, setShooting] = useState(false);
    const [gridPx, setGridPx] = useState(300);
    const [selected, setSelected] = useState<{ x: number, y: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Fetch game data
    const fetchGame = () => {
        if (!client || !gameId) return;
        setLoading(true);
        client.queryGame(Number(gameId))
            .then(setGame)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchGame();
        // eslint-disable-next-line
    }, [client, gameId]);

    // Responsive grid sizing
    useEffect(() => {
        const updateSize = () => {
            if (!gridRef.current) return;
            const { width, height } = gridRef.current.getBoundingClientRect();
            setGridPx(Math.floor(Math.min(width, height)));
        };
        updateSize();
        const observer = new window.ResizeObserver(updateSize);
        if (gridRef.current) observer.observe(gridRef.current);
        window.addEventListener("resize", updateSize);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    if (loading || !game) {
        return (
            <Group justify="center" style={{ minHeight: 200 }}>
                <Loader />
            </Group>
        );
    }

    const { size, shots_taken, name } = game.game;
    const shotMap = new Map<string, boolean>();
    shots_taken.forEach((shot: ShotFired) => {
        shotMap.set(`${shot.position.x},${shot.position.y}`, shot.hit);
    });

    const isSelected = (x: number, y: number) =>
        selected && selected.x === x && selected.y === y;

    const isShot = (x: number, y: number) =>
        shotMap.has(`${x},${y}`);

    async function handleFire() {
        if (!client || !gameId || !selected) return;
        setShooting(true);
        try {
            await client.takeShot(gameId, selected.x, selected.y);
            notifications.show({
                title: "Shot fired!",
                message: `You fired at (${selected.x + 1}, ${selected.y + 1})`,
                color: "blue",
                position: "bottom-right"
            });
            setSelected(null);
            fetchGame();
        } catch (e) {
            notifications.show({
                title: "Error",
                message: "Failed to fire shot.",
                color: "red",
                position: "top-left"
            });
        } finally {
            setShooting(false);
        }
    }

    return (
        <Container>
            <Group justify="flex-start" mb="xs">
                <Button variant="subtle" onClick={() => navigate("/app")}>
                    ← Back
                </Button>
            </Group>
            <Title order={2} ta="center" mb="md">{name}</Title>
            <div
                ref={gridRef}
                style={{
                    width: "100%",
                    maxWidth: 400,
                    height: "60vw",
                    maxHeight: 400,
                    margin: "20px auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 60
                }}
            >
                <SimpleGrid
                    cols={size}
                    spacing={"xs"}
                    style={{
                        width: gridPx,
                        height: gridPx,
                        transition: "width 0.2s, height 0.2s"
                    }}
                >
                    {Array.from({ length: size * size }).map((_, idx) => {
                        const x = idx % size;
                        const y = Math.floor(idx / size);
                        const key = `${x},${y}`;
                        const wasShot = isShot(x, y);
                        const wasHit = shotMap.get(key);

                        return (
                            <Button
                                key={key}
                                disabled={wasShot || shooting}
                                onClick={() => {
                                    if (!wasShot && !shooting) setSelected({ x, y });
                                }}
                                style={{
                                    width: gridPx / size - 4,
                                    height: gridPx / size - 4,
                                    background: wasShot
                                        ? wasHit
                                            ? "#ff5600"
                                            : "#61b3ef"
                                        : isSelected(x, y)
                                            ? "#5be105"
                                            : "#fff",
                                    color: "#333",
                                    border: isSelected(x, y)
                                        ? "2px solid #228be6"
                                        : "1px solid #ccc",
                                    cursor: wasShot ? "default" : "pointer",
                                    padding: 0,
                                }}
                            >
                            </Button>
                        );
                    })}
                </SimpleGrid>
            </div>
            <Group justify="center">
                <Button
                    color="blue"
                    disabled={
                        !selected ||
                        isShot(selected.x, selected.y) ||
                        shooting
                    }
                    onClick={handleFire}
                >
                    Fire
                </Button>
            </Group>
        </Container>
    );
}

export default ViewGame;