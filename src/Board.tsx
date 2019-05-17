import {Replay} from "./reader";
import React, {useEffect, useRef, useState} from "react";
import {createMyGL, MyGL} from "./myGL";
import {makeStyles} from "@material-ui/styles";

const orientations = "^v><";

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
    },
});

export const Board = (props: {
    replay: Replay,
    currentTurnIndex: number,
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
        myGL.initFrame();
        if (props.replay.turns.length <= props.currentTurnIndex) {
            return;
        }
        const turn = props.replay.turns[props.currentTurnIndex];
        for (let yy = 0; yy < props.replay.map_height; ++yy) {
            const y = props.replay.map_height - yy;
            for (let x = 0; x < props.replay.map_width; ++x) {
                const c = turn.map.charAt(x + yy * props.replay.map_width);
                if (c === '#') {
                    myGL.drawSprite(2, x, y);
                } else if (c === 'X') {
                    myGL.drawSprite(3, x, y);
                } else if (c === '~') {
                    myGL.drawSprite(4, x, y);
                } else if (c === 'o') {
                    myGL.drawSprite(6, x, y);
                } else {
                    myGL.drawSprite((x + y) % 2, x, y);
                }
            }
        }

        for (const player of turn.players) {
            if (player.life <= 0) {
                continue;
            }
            const orientationOffset = orientations.indexOf(player.bearing);
            const y = props.replay.map_height - player.y;
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
