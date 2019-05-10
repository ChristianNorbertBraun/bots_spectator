import React, {useEffect, useState} from 'react';
import './App.css';
import * as mygl from './gl';

export const App: React.FC = () => {
    const [count, setCount] = useState(0);
    return (
        <div className="App">
            <Board/>
            <Drawer
                count={count}
                setCount={setCount}
                onConnect={url => window.alert(`Connecting to ${url}`)}
            />
        </div>
    );
};

const Board: React.FC = () => {
    useEffect(() => {
            (async () => {
                console.log(`useEffect calls mygl.init`);
                const gl = mygl.getContext();
                const glInfo = await mygl.init(gl);
                mygl.render(gl, glInfo.programInfo, glInfo.texture);
            })();
        },
        [] // no deps means only run this effect once (after mount)
    );
    return (
        <div className="board">I am the board
            <canvas id="Canvas" style={{
                width: "100%",
                height: "100%",
            }}>
                Your browser does not support HTML5 canvas.
            </canvas>
        </div>
    );
};

const Drawer = (props: {
    count: number,
    setCount: (count: number) => void,
    onConnect: (url: string) => void,
}) => {

    const addressInputRef = React.createRef<HTMLInputElement>();

    return (
        <div className="drawer">I am the drawer

            <label>Address:</label>
            <input ref={addressInputRef} type="text"/>
            <button onClick={() => addressInputRef.current && props.onConnect(addressInputRef.current.value)}>
                Connect
            </button>
            Counter: {props.count}
        </div>
    );
};
