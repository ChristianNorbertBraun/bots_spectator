import {Replay} from "./reader";
import React, {useRef} from "react";

export const Drawer = (props: {
    replay?: Replay,
    connected: boolean,
    currentTurnIndex: number,
    onConnect: (url: string) => void,
    onReplayFileUploaded: (replay: Replay) => void,
    setCurrentTurnIndex: (turn: number) => void,
}) => {
    const addressInputRef = useRef<HTMLInputElement>(null);
    const currentTurn = props.replay && props.replay.turns[props.currentTurnIndex]

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
            <input disabled={props.connected}
                   ref={addressInputRef}
                   type="text"
                   value="ws://localhost:63189"/>
            <button
                disabled={props.connected}
                onClick={() => addressInputRef.current && props.onConnect(addressInputRef.current.value)}>
                Connect
            </button>
            {props.replay &&
            <>
                <div>Replay info:</div>
                <div>Current turn: {props.currentTurnIndex}</div>
                <button
                    disabled={props.currentTurnIndex <= 0}
                    onClick={() => props.setCurrentTurnIndex(props.currentTurnIndex - 1)}
                >-
                </button>
                <button
                    disabled={props.currentTurnIndex >= props.replay.max_turns - 1}
                    onClick={() => props.setCurrentTurnIndex(props.currentTurnIndex + 1)}
                >+
                </button>
                <div>Max turns: {props.replay.max_turns}</div>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Life</th>
                        <th>Move</th>
                        <th>Score</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentTurn && currentTurn.players.map(player =>
                        <tr key={player.name}>
                            <td>{player.name}</td>
                            <td>{player.life}</td>
                            <td>{player.moves}</td>
                            <td>{player.score}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
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
