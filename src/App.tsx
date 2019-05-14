import React, {useEffect, useState} from 'react';
import './App.css';
import {Header, Replay, Results, Turn} from "./reader";
import {Drawer} from "./Drawer";
import {Board} from "./Board";

export const App: React.FC = () => {
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined);
    // TODO Remove this hook eventually, it loads a dummy replay to ease testing
    useEffect(() => {
        // readExampleReplay().then(setReplay);
    }, []);

    return (
        <div className="App">
            {replay &&
            <Board
                replay={replay}
                currentTurnIndex={currentTurnIndex}
            />
            }
            <Drawer
                replay={replay}
                connected={webSocket !== undefined}
                currentTurnIndex={currentTurnIndex}
                onConnect={url =>
                    setWebSocket(connectAsSpectator(url, {
                        onHeader: (header: Header) => {
                            setReplay({...header, turns: [], results: []});
                            console.log("on Header: ", header);
                        },
                        onTurn: (turn: Turn) => {
                            console.log("replay value ", replay);
                            setReplay(replay => {
                                return {...replay!!, turns: [...replay!!.turns, turn]}
                            });
                            setCurrentTurnIndex(turn.turn - 1);
                            console.log("on Turn: ", turn);
                        },
                        onResults: (results: Results) => {
                            setReplay(replay => {
                                return {...replay!!, ...results};
                            });
                            console.log("on Header: ", results);
                        },
                        onDisconnect: () => {
                            setWebSocket(undefined);
                        }
                    }))}
                onReplayFileUploaded={replay => {
                    setCurrentTurnIndex(0);
                    setReplay(replay);
                }}
                setCurrentTurnIndex={setCurrentTurnIndex}
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
    const response = await fetch('result2.json');
    const content = await response.text();
    return JSON.parse(content);
}
