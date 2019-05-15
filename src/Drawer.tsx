import {isFinished, Replay, Turn} from "./reader";
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";

export const Drawer = (props: {
    replay?: Replay,
    connected: boolean,
    currentTurnIndex: number,
    onConnect: (url: string) => void,
    onReplayFileUploaded: (replay: Replay) => void,
    setCurrentTurnIndex: Dispatch<SetStateAction<number>>,
}) => {
    const addressInputRef = useRef<HTMLInputElement>(null);

    const currentTurn = props.replay && props.replay.turns[props.currentTurnIndex];

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
            <input
                disabled={props.connected}
                ref={addressInputRef}
                type="text"
                value="ws://localhost:63189"
            />
            <button
                disabled={props.connected}
                onClick={() => addressInputRef.current && props.onConnect(addressInputRef.current.value)}>
                Connect
            </button>
            {props.replay &&
            <TurnControls
                replay={props.replay}
                currentTurnIndex={props.currentTurnIndex}
                setCurrentTurnIndex={props.setCurrentTurnIndex}
            />
            }
            {currentTurn &&
            <PlayerTable
                currentTurn={currentTurn}
            />
            }
        </div>
    );
};

const TurnControls = (props: {
    replay: Replay,
    currentTurnIndex: number,
    setCurrentTurnIndex: Dispatch<SetStateAction<number>>,
}) => {
    const [turnInputValue, setTurnInputValue] = useState<string>((props.currentTurnIndex + 1).toString(10));
    const [autoplay, setAutoplay] = useState<boolean>(!isFinished(props.replay));
    const timerHandle = useRef<number>();

    useEffect(() => {
        setTurnInputValue((props.currentTurnIndex + 1).toString(10));
    }, [props.currentTurnIndex]);

    const nextMove = useCallback(() =>
            props.setCurrentTurnIndex(currentIndex => {
                return Math.min(props.replay.turns.length - 1, currentIndex + 1)
            })
        , [props]);

    const canNextMove = useCallback(() => props.currentTurnIndex < props.replay.turns.length - 1,
        [props]);

    const cancelTimer = useCallback(() => {
        if (timerHandle.current !== undefined) {
            window.clearInterval(timerHandle.current);
        }
        timerHandle.current = undefined;
    }, []);

    const startTimer = useCallback(() => {
        cancelTimer();
        timerHandle.current = window.setTimeout(() => {
            console.log("Timer triggered, nextMove()");
            timerHandle.current = undefined;
            nextMove();
        }, 500);
    }, [cancelTimer, nextMove]);

    const startAutoplay = () => {
        cancelTimer();
        setAutoplay(true);
    };

    const stopAutoplay = () => {
        cancelTimer();
        setAutoplay(false);
    };

    useEffect(() => {
        // console.log(`TurnControls#useEffect, autoplay: ${autoplay}, canNextMove():${canNextMove()}, currentTurnIndex:${props.currentTurnIndex}, props.replay.turns.length: ${props.replay.turns.length}, timerHandle.current: ${timerHandle.current}`);

        if (autoplay && !canNextMove()) {
            cancelTimer();
            if (isFinished(props.replay)) {
                setAutoplay(false);
            }
        } else if (autoplay && timerHandle.current === undefined && canNextMove()) {
            startTimer();
        }
    }, [autoplay, startTimer, cancelTimer, nextMove, canNextMove, props.currentTurnIndex, props.replay]);

    // console.log(`TurnControls#render, autoplay: ${autoplay}, currentTurnIndex:${props.currentTurnIndex}, timerHandle.current: ${timerHandle.current}`);
    return <>
        <label>Turn:</label>
        <input
            type="number"
            min={0}
            pattern="[0–9]*"
            value={turnInputValue}
            onChange={e => {
                setTurnInputValue(e.target.value);
                const turn = parseInt(e.target.value, 10) - 1;
                if (isNaN(turn)) return;
                props.replay && props.setCurrentTurnIndex(Math.max(0, Math.min(parseInt(e.target.value, 10) - 1, props.replay.turns.length - 1)));
            }}
        />
        <button
            disabled={props.currentTurnIndex <= 0}
            onClick={() => props.setCurrentTurnIndex(0)}
        >
            |&lt;
        </button>
        <button
            disabled={props.currentTurnIndex <= 0}
            onClick={() => props.setCurrentTurnIndex(props.currentTurnIndex - 1)}
        >
            &lt;
        </button>
        <button
            disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
            onClick={() => autoplay ? stopAutoplay() : startAutoplay()}
        > {autoplay ? <i className="material-icons">pause</i> : <i className="material-icons">play_arrow</i>}
        </button>
        <button
            disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
            onClick={nextMove}
        >
            &gt;
        </button>
        <button
            disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
            onClick={() => props.replay && props.setCurrentTurnIndex(props.replay.turns.length - 1)}
        >
            &gt;|
        </button>
    </>;
};

const PlayerTable = (props: {
    currentTurn: Turn,
}) => {
    return <table>
        <thead>
        <tr>
            <th>Name</th>
            <th>Life</th>
            <th>Move</th>
            <th>Score</th>
        </tr>
        </thead>
        <tbody>
        {props.currentTurn.players.map(player =>
            <tr key={player.name}>
                <td>{player.name}</td>
                <td>{player.life}</td>
                <td>{player.moves}</td>
                <td>{player.score}</td>
            </tr>
        )}
        </tbody>
    </table>
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
