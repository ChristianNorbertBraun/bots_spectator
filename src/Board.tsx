import {Replay} from "./reader";
import React, {useEffect, useRef, useState} from "react";
import {createMyGL, MyGL} from "./myGL";

export const Board = (props: {
    replay: Replay,
    currentTurn: number,
}) => {
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
        if (props.replay.turns.length <= props.currentTurn) {
            return;
        }
        const turn = props.replay.turns[props.currentTurn];
        for (let y = 0; y < props.replay.map_height; ++y) {
            for (let x = 0; x < props.replay.map_width; ++x) {
                const c = turn.map.charAt(x + y * props.replay.map_width);
                if (c === 'A') {
                    myGL.drawSprite(0, x, y);
                } else {
                    myGL.drawSprite(2, x, y);
                }
            }
        }
    });

    return (
        <div className="Board">
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