import {GameMode, Replay} from "./replay";
import React, {useEffect, useRef, useState} from "react";
import {createMyGL, drawSprite, DrawSpriteFunc, initFrame, MyGL} from "./myGL";
import {
    bombSpritePicker,
    defaultSpritePicker,
    hordeSpritePicker,
    pickPlayerSpriteStart,
    SpritePicker,
    wordSpritePicker
} from "./SpritePicker"
import {makeStyles} from "@material-ui/styles";
import {Dimension, isEqualDimension} from "./geom";
import {
    createPlanePosVertexBuffer,
    createTorusNormalVertexBuffer,
    createTorusPosVertexBuffer
} from "./vertexPosBuffers";
import {calcSeenFields} from "./mapUtils";

const orientations = "^v><";

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
        // This is important, otherwise the browser will cancel pointermove events
        touchAction: 'none',
    },
});

function pickSpritePickerFor(gameMode?: GameMode): SpritePicker {
    switch (gameMode) {
        case GameMode.training:
        case GameMode.escape:
        case GameMode.collect:
        case GameMode.snakes:
        case GameMode.avoid:
        case GameMode.rumble:
            return defaultSpritePicker;
        case GameMode.horde:
            return hordeSpritePicker;
        case GameMode.boom:
            return bombSpritePicker;
        case GameMode.word:
            return wordSpritePicker;
        default:
            return defaultSpritePicker;
    }
}

function renderFrame(props: {
    myGL: MyGL,
    spritePicker: SpritePicker,
    replay: Replay,
    rotation: { x: number, y: number },
    currentTurnIndex: number,
    tracedPlayers: number[],
    traceStart: number,
    drawSprite: DrawSpriteFunc,
}) {
    const {myGL} = props;
    initFrame(myGL, props.rotation);

    if (props.replay.turns.length <= props.currentTurnIndex) {
        return;
    }
    const turn = props.replay.turns[props.currentTurnIndex];
    const mapDim: Dimension = {
        width: props.replay.map_width, height: props.replay.map_height,
    };
    const seenTint = new Float32Array([1.5, 1.5, 1.5, 1]);
    const currentlyVisibleTint = new Float32Array([2.0, 2.0, 2.0, 1]);
    const seenFields = calcSeenFields({
        mapDim,
        turns: props.replay.turns.slice(props.traceStart, props.currentTurnIndex),
        tracedPlayers: props.tracedPlayers,
        viewRadius: props.replay.view_radius,
    });
    const currentlyVisibleFields = calcSeenFields({
        mapDim,
        turns: [props.replay.turns[props.currentTurnIndex]],
        tracedPlayers: props.tracedPlayers,
        viewRadius: props.replay.view_radius,
    });

    for (let yy = 0; yy < props.replay.map_height; ++yy) {
        const y = props.replay.map_height - yy - 1;
        for (let x = 0; x < props.replay.map_width; ++x) {
            const pos = {x, y};
            const index = x + yy * props.replay.map_width;
            const c = turn.map.charAt(index);
            const tint = (currentlyVisibleFields[index] && currentlyVisibleTint) || (seenFields[index] && seenTint) || undefined;
            for (const r of props.spritePicker(c, x, y)) {
                props.drawSprite(r.spriteIndex, pos, r.tint || tint);
            }
        }
    }

    // Draw traces
    const traceTint = new Float32Array([1, 1, 1, 0.3]);
    for (let turnIndex = props.traceStart; turnIndex < props.currentTurnIndex; ++turnIndex) {
        const turn = props.replay.turns[turnIndex];
        for (let i = 0; i < turn.players.length; ++i) {
            if (props.tracedPlayers.indexOf(i) < 0) continue;
            let player = turn.players[i];
            const orientationOffset = orientations.indexOf(player.bearing);
            const y = props.replay.map_height - player.y - 1;
            const pos = {x: player.x, y};
            const playerSprite = pickPlayerSpriteStart(player.name, player.x, player.y)[0];
            props.drawSprite(playerSprite.spriteIndex + orientationOffset, pos, traceTint);
        }
    }

    for (const player of turn.players) {
        if (player.life <= 0) {
            continue;
        }
        const playerSprite = pickPlayerSpriteStart(player.name, player.x, player.y)[0];
        const orientationOffset = orientations.indexOf(player.bearing);
        const y = props.replay.map_height - player.y - 1;
        const pos = {x: player.x, y};
        props.drawSprite(playerSprite.spriteIndex + orientationOffset, pos);
    }
}

const rotationSpeed = 0.05;

interface PerMapVertexBuffers {
    mapDim: Dimension,
    torusPosVertexBuffer: WebGLBuffer,
    torusNormalVertexBuffer: WebGLBuffer,
    planePosVertexBuffer: WebGLBuffer,
};

export const Board = (props: {
    replay: Replay,
    currentTurnIndex: number,
    tracedPlayers: number[],
    mode3d: boolean,
    traceStart: number,
}) => {
    const styles = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [myGL, setMyGL] = useState<MyGL>();
    const perMapVertexBuffers = useRef<PerMapVertexBuffers | null>(null);
    const [rotation, setRotation] = useState({x: 0, y: 0});
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
        const mapDim: Dimension = {
            width: props.replay.map_width, height: props.replay.map_height,
        };
        if (perMapVertexBuffers.current && isEqualDimension(perMapVertexBuffers.current.mapDim, mapDim)) return;
        console.log(`Recreating vertex pos buffer for map dims: ${mapDim}`);
        perMapVertexBuffers.current = {
            mapDim,
            planePosVertexBuffer: createPlanePosVertexBuffer(myGL!!.gl, mapDim),
            torusNormalVertexBuffer: createTorusNormalVertexBuffer(myGL!!.gl, mapDim),
            torusPosVertexBuffer: createTorusPosVertexBuffer(myGL!!.gl, mapDim)
        };
    }, [props.replay, myGL]);

    useEffect(() => {
        if (myGL === undefined) return;
        const mapDim: Dimension = {
            width: props.replay.map_width, height: props.replay.map_height,
        };
        const b = perMapVertexBuffers.current!!;
        const drawSpriteFunc = props.mode3d
            ? drawSprite(myGL, mapDim, b.torusPosVertexBuffer, b.torusNormalVertexBuffer)
            : drawSprite(myGL, mapDim, b.planePosVertexBuffer);
        renderFrame({
            myGL,
            spritePicker: pickSpritePickerFor(props.replay.mode),
            drawSprite: drawSpriteFunc,
            rotation: props.mode3d ? rotation : {x: 0, y: 0},
            ...props,
        });
    });

    return (
        <div className={styles.root}>
            <canvas
                onPointerMove={ev => {
                    if (ev.buttons !== 0 && props.mode3d) {
                        const mx = ev.movementY * rotationSpeed;
                        const my = ev.movementX * rotationSpeed;
                        setRotation((rot) => {
                            return {
                                x: rot.x + mx,
                                y: rot.y + my,
                            }
                        })
                    }
                }}
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
