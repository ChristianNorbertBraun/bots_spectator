import React, {useEffect, useState} from 'react';
import './App.css';
import {Header, Replay, Results, Turn} from "./reader";
import {Drawer} from "./Drawer";
import {Board} from "./Board";

export const App: React.FC = () => {
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [currentTurn, setCurrentTurn] = useState(0);
    // TODO Remove this hook eventually, it loads a dummy replay to ease testing
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
                onConnect={url => connectAsSpectator(url, {
                    onHeader: (header: Header) => {
                        console.log("on Header: ", header);
                    },
                    onTurn: (turn: Turn) => {
                        console.log("on Turn: ", turn);
                    },
                    onResults: (results: Results) => {
                        console.log("on Header: ", results);
                    },
                })}
                onReplayFileUploaded={replay => {
                    setCurrentTurn(0);
                    setReplay(replay);
                }}
                currentTurn={currentTurn}
                setCurrentTurn={setCurrentTurn}
            />
        </div>
    );
};

interface SpectatorListener {
    onHeader: (header: Header) => void;
    onTurn: (turn: Turn) => void;
    onResults: (results: Results) => void;
}

function connectAsSpectator(url: string, listener: SpectatorListener) {
    const webSocket = new WebSocket(url);
    webSocket.onmessage = message => {
        console.log("onmessage", message);
        if (message.data.max_turns !== undefined) {
            listener.onHeader(message.data);
        } else if (message.data.results !== undefined) {
            listener.onResults(message.data);
        } else if (message.data.turn !== undefined) {
            listener.onTurn(message.data);
        } else {
            throw Error(`unexpected message: ${message.data}`);
        }
    }
}

async function readExampleReplay(): Promise<Replay> {
    const response = await fetch('result1.json');
    const content = await response.text();
    return JSON.parse(content);
}
