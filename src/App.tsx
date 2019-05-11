import React, {useEffect, useState} from 'react';
import './App.css';
import * as mygl from './gl';
import {Replay} from "./reader";

export const App: React.FC = () => {
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [currentTurn, setCurrentTurn] = useState(0);
    return (
        <div className="App">
            <Board/>
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
            {replay && JSON.stringify(replay.turns[currentTurn])}
        </div>
    );
};

const Board: React.FC = () => {

    const canvasRef = React.createRef<HTMLCanvasElement>();

    useEffect(() => {
            if (canvasRef.current == null) {
                return;
            }
            console.log("Initializing WebGL");
            const c = canvasRef.current;
            const gl = c.getContext('webgl') || c.getContext('experimental-webgl')!!;
            mygl.init(gl).then(glInfo => {
                mygl.render(gl, glInfo.programInfo, glInfo.texture);
            });
        },
        [] // no deps means only run this effect once (after mount)
    );
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

    const addressInputRef = React.createRef<HTMLInputElement>();

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
                <button onClick={() => props.setCurrentTurn(props.currentTurn + 1)}>+1</button>
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
