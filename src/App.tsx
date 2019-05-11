import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import {createMyGL, MyGL} from './myGL';
import {Replay} from "./reader";

export const App: React.FC = () => {
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [currentTurn, setCurrentTurn] = useState(0);
    useEffect(() => {
        readExampleReplay().then(setReplay);
    }, []);
    return (
        <div className="App">
            {replay &&
            <Board
                replay={replay}
                currentTurn={currentTurn}
            />
            }
            <Drawer
                replay={replay}
                onConnect={url => window.alert(`Connecting to ${url}`)}
                onReplayFileUploaded={replay => {
                    console.log("Replay: ", replay);
                    setCurrentTurn(0);
                    setReplay(replay);
                }}
                currentTurn={currentTurn}
                setCurrentTurn={setCurrentTurn}
            />
        </div>
    );
};

const Board = (props: {
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
                console.log("Setting glInfoRef");
                setMyGL(myGL);
            });
        },
        [] // no deps means only run this effect once (after mount)
    );

    useEffect(() => {
        if (myGL === undefined) return;
        console.log("Rendering frame");
        myGL.initFrame();
        const turn = props.replay.turns[props.currentTurn];
        for (let y = 0; y < props.replay.map_height; ++y) {
            for (let x = 0; x < props.replay.map_width; ++x) {
                const c = turn.map.charAt(x + y * props.replay.map_width);
                if (c === 'A') {
                    console.log(`Rendering bot at ${x},${y}`);
                    myGL.drawSprite(0, x, y);
                } else {
                    myGL.drawSprite(2, x, y);
                }
            }
        }
    });
    return (
        <div className="board">
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

const Drawer = (props: {
    onConnect: (url: string) => void,
    onReplayFileUploaded: (replay: Replay) => void,
    replay?: Replay,
    currentTurn: number,
    setCurrentTurn: (turn: number) => void,
}) => {

    const addressInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="drawer">
            <input
                id="replayFileInput"
                type="file"
                className="inputfile"
                onChange={async e => {
                    e.preventDefault();
                    if (e.target.files != null && e.target.files.length > 0) {
                        const file: File = e.target.files[0];
                        console.log("File selected: ", file);
                        e.target.value = ''; // Reset value, so user may upload the same filename again
                        const content = await readFileContents(file);
                        const replay: Replay = JSON.parse(content);
                        props.onReplayFileUploaded(replay);
                    }

                }}
            />
            <label htmlFor="replayFileInput">
                Load replay from file
            </label>
            <label>Address:</label>
            <input ref={addressInputRef} type="text"/>
            <button onClick={() => addressInputRef.current && props.onConnect(addressInputRef.current.value)}>
                Connect
            </button>
            {props.replay &&
            <>
                <div>Replay info:</div>
                <div>Current turn: {props.currentTurn}</div>
                <button
                    disabled={props.currentTurn <= 0}
                    onClick={() => props.setCurrentTurn(props.currentTurn - 1)}
                >-
                </button>
                <button
                    disabled={props.currentTurn >= props.replay.max_turns - 1}
                    onClick={() => props.setCurrentTurn(props.currentTurn + 1)}
                >+
                </button>
                <div>Max turns: {props.replay.max_turns}</div>
            </>
            }
        </div>
    );
};

async function readFileContents(file: File): Promise<string> {
    return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (event) {
            const contents = reader.result!! as string;
            resolve(contents);
        };
    });
}

async function readExampleReplay(): Promise<Replay> {
    const response = await fetch('/result1.json');
    const content = await response.text();
    return JSON.parse(content);
}

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
