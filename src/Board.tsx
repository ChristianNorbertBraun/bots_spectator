import {Replay} from "./replay";
import React, {useEffect, useRef, useState} from "react";
import {createMyGL, drawSprite, initFrame, MyGL} from "./myGL";
import {bombWorldSpritePicker, pickMonsterSprite, pickPlayerSpriteStart} from "./SpritePicker"
import {makeStyles} from "@material-ui/styles";
import {Dimension} from "./geom";
import {createPlanePosVertexBuffer, createTorusPosVertexBuffer} from "./vertexPosBuffers";

const orientations = "^v><";

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
        // This is important, otherwise the browser will cancel pointermove events
        touchAction: 'none',
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

function renderFrame(props: {
    myGL: MyGL,
    vertexPosBuffer: WebGLBuffer,
    replay: Replay,
    rotation: { x: number, y: number },
    currentTurnIndex: number,
    tracedPlayers: number[],
}) {
    const {myGL} = props;
    const mapDim: Dimension = {
        width: props.replay.map_width, height: props.replay.map_height,
    };
    initFrame(myGL, props.rotation);

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
            const pos = {x, y};
            const index = x + yy * props.replay.map_width;
            const c = turn.map.charAt(index);
            const tint = exploredFields[index] ? exploredTint : undefined;

            const spriteIndex = bombWorldSpritePicker(c, x, y);
            // const spriteIndex = hordeWorldSpritePicker(c, x, y);
            drawSprite(myGL, props.vertexPosBuffer, mapDim, spriteIndex!!, pos, tint);

            const monsterSpriteIndex = pickMonsterSprite(c, x, y);
            if (monsterSpriteIndex !== undefined) {
                drawSprite(myGL, props.vertexPosBuffer, mapDim, monsterSpriteIndex!!, pos, tint);
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
            const pos = {x: player.x, y};
            const playerSpriteStartIndex = pickPlayerSpriteStart(player.name, player.x, player.y);
            drawSprite(myGL, props.vertexPosBuffer, mapDim, playerSpriteStartIndex!! + orientationOffset, pos, traceTint);
        }
    }

    for (const player of turn.players) {
        if (player.life <= 0) {
            continue;
        }
        const playerSpriteStartIndex = pickPlayerSpriteStart(player.name, player.x, player.y);
        const orientationOffset = orientations.indexOf(player.bearing);
        const y = props.replay.map_height - player.y - 1;
        const pos = {x: player.x, y};
        drawSprite(myGL, props.vertexPosBuffer, mapDim, playerSpriteStartIndex!! + orientationOffset, pos);
    }
}

const rotationSpeed = 0.05;

export const Board = (props: {
    replay: Replay,
    currentTurnIndex: number,
    tracedPlayers: number[],
    mode3d: boolean,
}) => {
    const styles = useStyles();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [myGL, setMyGL] = useState<MyGL>();
    const torusVertexPosBuffer = useRef<WebGLBuffer | null>(null);
    const planeVertexPosBuffer = useRef<WebGLBuffer | null>(null);
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
        console.log(`Recreating vertex pos buffer for map dims: ${mapDim}`);
        torusVertexPosBuffer.current = createTorusPosVertexBuffer(myGL!!.gl, mapDim);
        planeVertexPosBuffer.current = createPlanePosVertexBuffer(myGL!!.gl, mapDim);
    }, [props.replay, myGL]);

    useEffect(() => {
        if (myGL === undefined) return;
        const vertexPosBuffer = props.mode3d ? torusVertexPosBuffer.current!! : planeVertexPosBuffer.current!!;
        renderFrame({
            myGL,
            vertexPosBuffer,
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
