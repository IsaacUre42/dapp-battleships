import React, { useRef, useEffect } from "react";
import type { ShotFired } from "../utils/battleship-types";

interface Props {
    size: number;
    shots: ShotFired[];
    width?: number;
    height?: number;
}

export default function GameGridPreview({ size, shots, width = 32, height = 32 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = "#bbb";
        for (let i = 0; i <= size; i++) {
            ctx.beginPath();
            ctx.moveTo(i * (width / size), 0);
            ctx.lineTo(i * (width / size), height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * (height / size));
            ctx.lineTo(width, i * (height / size));
            ctx.stroke();
        }

        // Draw shots
        shots.forEach(({ position, hit }) => {
            ctx.fillStyle = hit ? "#ff5600" : "#61b3ef";
            ctx.fillRect(
                position.x * (width / size) + 1,
                position.y * (height / size) + 1,
                (width / size) - 2,
                (height / size) - 2
            );
        });
    }, [size, shots, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                display: "block",
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                imageRendering: "pixelated", // <- add this line
            }}
            aria-label="Game grid preview"
        />
    );
}