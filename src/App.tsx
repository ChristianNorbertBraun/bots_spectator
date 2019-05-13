import React, {useEffect, useState} from 'react';
import './App.css';
import {Replay} from "./reader";
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
                onConnect={url => window.alert(`Connecting to ${url}`)}
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

async function readExampleReplay(): Promise<Replay> {
    const response = await fetch('result1.json');
    const content = await response.text();
    return JSON.parse(content);
}
