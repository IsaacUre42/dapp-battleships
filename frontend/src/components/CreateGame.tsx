import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Container, Group, Modal, SimpleGrid, Text, TextInput, Loader, Overlay } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { ShipConstructor } from "../utils/battleship-types.ts";
import { useClient } from "../contexts/ClientContext.tsx";
import { useNavigate } from "react-router-dom";

type Ship = {
    size: number;
    x: number;
    y: number;
    isHorizontal: boolean;
};

interface CreateGameProps {
    gridSize?: number;
    shipSizes?: number[];
    cost?: number;
    onCreated?: () => void;
}

function CreateGame({ gridSize = 10, shipSizes = [2, 3, 4, 6], cost = 95, onCreated }: CreateGameProps) {
    const client = useClient();
    const navigate = useNavigate();
    const [ships, setShips] = useState<Ship[]>([]);
    const [selectedSize, setSelectedSize] = useState<number | null>(null);
    const [activeShip, setActiveShip] = useState<Ship | null>(null);
    const [gridPx, setGridPx] = useState<number>(300);
    const [modalOpen, setModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [gameName, setGameName] = useState("");
    const gridContainerRef = useRef<HTMLDivElement>(null);

    if (!client) {
        navigate("/");
        return null;
    }

    // Responsive grid sizing
    useEffect(() => {
        const updateSize = () => {
            if (!gridContainerRef.current) return;
            const { width, height } = gridContainerRef.current.getBoundingClientRect();
            setGridPx(Math.floor(Math.min(width, height)));
        };
        updateSize();
        const observer = new window.ResizeObserver(updateSize);
        if (gridContainerRef.current) observer.observe(gridContainerRef.current);
        window.addEventListener("resize", updateSize);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateSize);
        };
    }, []);

    // Handle keyboard controls
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!activeShip) return;
            let { x, y, isHorizontal, size } = activeShip;
            if (e.key === "ArrowUp" && isPositionValid(x, y - 1, isHorizontal, size))
                y = Math.max(0, y - 1);
            if (e.key === "ArrowDown" && isPositionValid(x, y + 1, isHorizontal, size))
                y = Math.min(gridSize - (isHorizontal ? 1 : activeShip.size), y + 1);
            if (e.key === "ArrowLeft" && isPositionValid(x - 1, y, isHorizontal, size))
                x = Math.max(0, x - 1);
            if (e.key === "ArrowRight" && isPositionValid(x + 1, y, isHorizontal, size))
                x = Math.min(gridSize - (isHorizontal ? activeShip.size : 1), x + 1);
            if (e.key === " " && isPositionValid(x, y, !isHorizontal, size))
                isHorizontal = !isHorizontal;
            setActiveShip({ ...activeShip, x, y, isHorizontal });
        },
        [activeShip, gridSize]
    );

    function isPositionValid(x: number, y: number, is_horizontal: boolean, length: number): boolean {
        if (is_horizontal) {
            return (x >= 0 && (x + length <= gridSize) && y >= 0 && y < gridSize);
        } else {
            return (x >= 0 && x < gridSize && y >= 0 && (y + length) <= gridSize);
        }
    }

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Place ship on grid
    const placeShip = () => {
        if (activeShip && canPlaceShip()) {
            setShips([...ships, activeShip]);
            setActiveShip(null);
            setSelectedSize(null);
        }
    };

    function canPlaceShip(): boolean {
        if (!activeShip) return false;

        // Get all cells occupied by the active ship
        const activeCells = new Set<string>();
        for (let i = 0; i < activeShip.size; i++) {
            const x = activeShip.x + (activeShip.isHorizontal ? i : 0);
            const y = activeShip.y + (activeShip.isHorizontal ? 0 : i);
            activeCells.add(`${x},${y}`);
        }

        // Check against all placed ships
        for (const ship of ships) {
            for (let i = 0; i < ship.size; i++) {
                const x = ship.x + (ship.isHorizontal ? i : 0);
                const y = ship.y + (ship.isHorizontal ? 0 : i);
                if (activeCells.has(`${x},${y}`)) {
                    return false; // Overlap found
                }
            }
        }

        return true; // No overlap
    }


    function handleConfirm() {
        setModalOpen(true);
    }

    async function handleModalConfirm() {
        setModalOpen(false);
        setCreating(true);
        try {
            const formattedShips: ShipConstructor[] = ships.map(s => ({
                position: { x: s.x, y: s.y },
                length: s.size,
                is_horizontal: s.isHorizontal,
            }));
            // @ts-ignore
            await client.makeGame(gridSize, gameName || "My Game", formattedShips, cost);
            notifications.show({
                title: "Game Created",
                message: "Your game was created successfully!",
                color: "green",
                position: "top-left"
            });
            if (onCreated) onCreated();
        } catch (e) {
            notifications.show({
                title: "Error",
                message: "Failed to create game.",
                color: "red",
                position: "top-left"
            });
        } finally {
            setCreating(false);
        }
    }


    function handleCancel() {
        setShips([]);
        setActiveShip(null);
        setSelectedSize(null);
    }

    // Select a ship to place
    const selectShip = (size: number) => {
        setSelectedSize(size);
        setActiveShip({ size, x: 0, y: 0, isHorizontal: true });
    };

    // Render grid with ships
    const renderGrid = () => {
        const grid = Array.from({ length: gridSize }, () =>
            Array(gridSize).fill(null)
        );
        ships.forEach((ship, idx) => {
            for (let i = 0; i < ship.size; i++) {
                const x = ship.x + (ship.isHorizontal ? i : 0);
                const y = ship.y + (ship.isHorizontal ? 0 : i);
                grid[y][x] = idx + 1;
            }
        });
        if (activeShip) {
            for (let i = 0; i < activeShip.size; i++) {
                const x = activeShip.x + (activeShip.isHorizontal ? i : 0);
                const y = activeShip.y + (activeShip.isHorizontal ? 0 : i);
                grid[y][x] = "A";
            }
        }

        return (
            <SimpleGrid
                cols={gridSize}
                spacing={"xs"}
                style={{
                    width: gridPx,
                    height: gridPx,
                    transition: "width 0.2s, height 0.2s"
                }}
            >
                {grid.flat().map((cell, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: gridPx / gridSize - 4,
                            height: gridPx / gridSize - 4,
                            border: "1px solid #ccc",
                            background: cell
                                ? cell === "A"
                                    ? "#4dabf7"
                                    : "#82c91e"
                                : "#fff",
                        }}
                    />
                ))}
            </SimpleGrid>
        );
    };

    return (

        <Container style={{ position: "relative" }}>
            <Group justify="flex-start" mb="xs">
                <Button variant="subtle" onClick={() => onCreated}>
                    ← Back
                </Button>
            </Group>
            {creating && (
                <>
                    <Overlay opacity={0.6} color="#fff" zIndex={1000} />
                    <Group justify="center" style={{ position: "absolute", top: "40%", left: 0, right: 0, zIndex: 1100 }}>
                        <Loader size="xl" />
                    </Group>
                </>
            )}
            <Text ta="center" style={{ marginBottom: 5 }}>
                Use arrow keys to move, space to rotate. Place all ships to continue.
            </Text>
            <Group justify="center" mb="md">
                <TextInput
                    label="Game Name"
                    placeholder="Enter a name for your game"
                    value={gameName}
                    onChange={e => setGameName(e.currentTarget.value)}
                    disabled={creating}
                    required
                    style={{ minWidth: 250 }}
                />
            </Group>
            <Group justify={"center"}>
                {shipSizes.map((size) => (
                    <Button
                        key={size}
                        variant={selectedSize === size ? "filled" : "outline"}
                        onClick={() => selectShip(size)}
                        disabled={ships.some((s) => s.size === size) || !!activeShip || creating}
                    >
                        Place ship of size {size}
                    </Button>
                ))}
            </Group>
            <div
                ref={gridContainerRef}
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
                {renderGrid()}
            </div>
            {activeShip && (
                <Group justify="center" mt="md">
                    <Button onClick={placeShip} color="teal" disabled={!canPlaceShip() || creating}>
                        Place Ship
                    </Button>
                </Group>
            )}
            {ships.length === shipSizes.length && (
                <Group justify="center" mt="md">
                    <Button color="green" onClick={handleConfirm} disabled={creating || !gameName.trim()}>Confirm</Button>
                    <Button color="red" onClick={handleCancel} disabled={creating}>Cancel</Button>
                </Group>
            )}
            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Confirm Game Creation"
                centered
                withinPortal={true}
            >
                <Text mb="md">
                    The cost to create this game is <b>{cost} uscrt</b>.<br />
                    Are you sure you want to create the game?
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setModalOpen(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button color="green" onClick={handleModalConfirm} disabled={creating}>
                        Confirm
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}

export default CreateGame;