import React, { useEffect, useState } from 'react';
import './App.css';
import { Header, Replay, Results, Turn } from "./reader";
import { Drawer } from "./Drawer";
import { Board } from "./Board";

export const App: React.FC = () => {
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined);
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
                connected={webSocket !== undefined}
                currentTurn={currentTurn}
                onConnect={url =>
                    setWebSocket(connectAsSpectator(url, {
                        onHeader: (header: Header) => {
                            setReplay({ ...header, turns: [], results: [] });
                            console.log("on Header: ", header);
                        },
                        onTurn: (turn: Turn) => {
                            setReplay({ ...replay!!, turns: [...replay!!.turns, turn] });
                            setCurrentTurn(turn.turn);
                            console.log("on Turn: ", turn);
                        },
                        onResults: (results: Results) => {
                            setReplay({ ...replay!!, ...results });
                            console.log("on Header: ", results);
                        },
                        onDisconnect: () => {
                            setWebSocket(undefined);
                        }
                    }))}
                onReplayFileUploaded={replay => {
                    setCurrentTurn(0);
                    setReplay(replay);
                }}
                setCurrentTurn={setCurrentTurn}
            />
        </div>
    );
};

interface SpectatorListener {
    onHeader: (header: Header) => void;
    onTurn: (turn: Turn) => void;
    onResults: (results: Results) => void;
    onDisconnect: () => void;
}

function connectAsSpectator(url: string, listener: SpectatorListener): WebSocket {
    const webSocket = new WebSocket(url);
    webSocket.onmessage = message => {
        console.log("onmessage", message);
        const messageData = JSON.parse(message.data);
        if (messageData.max_turns !== undefined) {
            listener.onHeader(messageData);
        } else if (messageData.results !== undefined) {
            listener.onResults(messageData);
        } else if (messageData.turn !== undefined) {
            listener.onTurn(messageData);
        } else {
            throw Error(`unexpected message: ${message.data}`);
        }
    }
    webSocket.onclose = listener.onDisconnect;

    return webSocket;
}

async function readExampleReplay(): Promise<Replay> {
    const response = await fetch('result1.json');
    const content = await response.text();
    return JSON.parse(content);
}
