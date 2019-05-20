import {Replay} from "./replay";
import React, {useEffect, useRef, useState} from "react";
import {createMyGL, MyGL} from "./myGL";
import {makeStyles} from "@material-ui/styles";

const orientations = "^v><";

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
    },
});

type BitSet = boolean[];

function setPlayerView(posx: number, posy: number, radius: number, mapWidth: number, mapHeight: number, set: BitSet) {
    for (let x = posx - radius; x <= posx + radius; ++x) {
        for (let y = posy - radius; y <= posy + radius; ++y) {
            const xx = (x + mapWidth) % mapWidth;
            const yy = (y + mapHeight) % mapHeight;
            set[xx + yy * mapWidth] = true;
        }
    }
    return set;
}

export const Board = (props: {
    replay: Replay,
    currentTurnIndex: number,
    tracedPlayers: number[],
}) => {
    const styles = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [myGL, setMyGL] = useState<MyGL>();
    useWindowSize(); // This dependencies triggers a re-render when the window size changes

    useEffect(() => {
            if (canvasRef.current == null) {
                return;
            }
            console.log("Initializing WebGL");
            const c = canvasRef.current;
            const gl = c.getContext('webgl') || c.getContext('experimental-webgl')!!;
            createMyGL(gl).then(myGL => {
                setMyGL(myGL);
            });
        },
        [] // no deps means only run this effect once (after mount)
    );

    useEffect(() => {
        if (myGL === undefined) return;
        console.log("Rendering frame");
        const worldRect = {
            x: 0, y: 0, width: props.replay.map_width, height: props.replay.map_height,
        };
        myGL.initFrame(worldRect);
        if (props.replay.turns.length <= props.currentTurnIndex) {
            return;
        }
        const turn = props.replay.turns[props.currentTurnIndex];

        const exploredTint = new Float32Array([1.5, 1.5, 1.5, 1]);
        const exploredFields = new Array(props.replay.map_width * props.replay.map_height).fill(false);
        for (let turnIndex = 0; turnIndex <= props.currentTurnIndex; ++turnIndex) {
            const turn = props.replay.turns[turnIndex];
            for (let i = 0; i < turn.players.length; ++i) {
                if (props.tracedPlayers.indexOf(i) < 0) continue;
                let player = turn.players[i];
                setPlayerView(player.x, player.y, props.replay.view_radius, props.replay.map_width, props.replay.map_height, exploredFields);
            }
        }

        for (let yy = 0; yy < props.replay.map_height; ++yy) {
            const y = props.replay.map_height - yy - 1;
            for (let x = 0; x < props.replay.map_width; ++x) {
                const index = x + yy * props.replay.map_width;
                const c = turn.map.charAt(index);
                const tint = exploredFields[index] ? exploredTint : undefined;
                if (c === '#') {
                    myGL.drawSprite(2, x, y, tint);
                } else if (c === 'X') {
                    myGL.drawSprite(3, x, y, tint);
                } else if (c === '~') {
                    myGL.drawSprite(4, x, y, tint);
                } else if (c === 'o') {
                    myGL.drawSprite(6, x, y, tint);
                } else {
                    myGL.drawSprite((x + y) % 2, x, y, tint);
                }
            }
        }
        // Draw traces
        const traceTint = new Float32Array([1, 1, 1, 0.3]);
        for (let turnIndex = 0; turnIndex < props.currentTurnIndex; ++turnIndex) {
            const turn = props.replay.turns[turnIndex];
            for (let i = 0; i < turn.players.length; ++i) {
                if (props.tracedPlayers.indexOf(i) < 0) continue;
                let player = turn.players[i];
                const orientationOffset = orientations.indexOf(player.bearing);
                const y = props.replay.map_height - player.y - 1;
                myGL.drawSprite(48 + orientationOffset, player.x, y, traceTint);
            }
        }

        for (const player of turn.players) {
            if (player.life <= 0) {
                continue;
            }
            const orientationOffset = orientations.indexOf(player.bearing);
            const y = props.replay.map_height - player.y - 1;
            myGL.drawSprite(48 + orientationOffset, player.x, y);
        }
    });

    return (
        <div className={styles.root}>
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            >
                Your browser does not support HTML5 canvas.
            </canvas>
        </div>
    );
};

/**
 * Adapted from https://usehooks.com/useWindowSize/
 */
function useWindowSize() {
    const [windowSize, setWindowSize] = useState(getWindowSize);

    useEffect(() => {
        function handleResize() {
            setWindowSize(getWindowSize());
        }

        window.addEventListener('resize', handleResize);
        return (): void => window.removeEventListener('resize', handleResize);
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return windowSize;
}

function getWindowSize() {
    const isClient = typeof window === 'object';
    return {
        width: isClient ? window.innerWidth : undefined,
        height: isClient ? window.innerHeight : undefined
    };
}

function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

// eslint-disable-next-line
function randomIntBetween(min: number, max: number): number {
    return min + randomInt(max - min);
}
