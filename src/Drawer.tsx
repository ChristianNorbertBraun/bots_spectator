import {Replay} from "./reader";
import React, {useRef} from "react";

export const Drawer = (props: {
    replay?: Replay,
    connected: boolean,
    currentTurn: number,
    onConnect: (url: string) => void,
    onReplayFileUploaded: (replay: Replay) => void,
    setCurrentTurn: (turn: number) => void,
}) => {
    const addressInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="Drawer">
            <input
                id="replayFileInput"
                type="file"
                className="inputfile"
                onChange={async e => {
                    e.preventDefault();
                    if (e.target.files != null && e.target.files.length > 0) {
                        const file: File = e.target.files[0];
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
            <input ref={addressInputRef} type="text" value="ws://localhost:63189" />
            <button 
            disabled={props.connected}
            onClick={() => addressInputRef.current && props.onConnect(addressInputRef.current.value)}>
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
