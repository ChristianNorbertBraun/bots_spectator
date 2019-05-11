import React, {useEffect} from 'react';
import './App.css';
import * as mygl from './gl';

export const App: React.FC = () => {
//    const [count, setCount] = useState(0);
    return (
        <div className="App">
            <Board/>
            <Drawer
                onConnect={url => window.alert(`Connecting to ${url}`)}
            />
        </div>
    );
};

const Board: React.FC = () => {

    const canvasRef = React.createRef<HTMLCanvasElement>();

    useEffect(() => {
            if (canvasRef.current == null) {
                return;
            }
            const c = canvasRef.current;
            const gl = c.getContext('webgl') || c.getContext('experimental-webgl')!!;
            mygl.init(gl).then(glInfo => {
                mygl.render(gl, glInfo.programInfo, glInfo.texture);
            });
        },
        [canvasRef] // no deps means only run this effect once (after mount)
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
}) => {

    const addressInputRef = React.createRef<HTMLInputElement>();

    return (
        <div className="drawer">
            <input
                id="replayFileInput"
                type="file"
                className="inputfile"
                onChange={e => {
                    e.preventDefault();
                    if (e.target.files != null && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        console.log("file selected: ", file);
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
        </div>
    );
};
