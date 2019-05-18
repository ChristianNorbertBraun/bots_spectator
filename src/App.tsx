import React, {useEffect, useState} from 'react';
import {Header, Replay, Results, Turn} from "./replay";
import {Drawer} from "./Drawer";
import {Board} from "./Board";
import {createMuiTheme, CssBaseline, MuiThemeProvider} from "@material-ui/core";
import {makeStyles} from "@material-ui/styles";
import {paletteColor0, paletteColor3, paletteColor5} from "./palette";

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: {
            main: paletteColor0,
        },
        secondary: {
            main: paletteColor3,
        },
        background: {
            default: paletteColor5,
        },
    },
});

const useStyles = makeStyles({
    root: {
        display: 'flex',
        height: "100%",
        width: "100%",
        top: 0,
        position: "fixed",
    },
});

async function tryToLoadReplayFromUrl(): Promise<Replay | undefined> {
    const params = new URLSearchParams(document.location.search);
    const replayUrl = params.get('replay_url');
    if (!replayUrl) return undefined;
    const response = await fetch(replayUrl);
    return response.json();
}

export const App: React.FC = () => {
    const styles = useStyles();
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [replayIndex, setReplayIndex] = useState(0);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined);

    useEffect(() => {
        tryToLoadReplayFromUrl().then(setReplay);
    }, []);

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline/>
            <div className={styles.root}>
                {replay &&
                <Board
                    replay={replay}
                    currentTurnIndex={currentTurnIndex}
                />
                }
                <Drawer
                    key={replayIndex}
                    replay={replay}
                    connected={webSocket !== undefined}
                    currentTurnIndex={currentTurnIndex}
                    onConnect={url => {
                        setReplay(undefined);
                        setReplayIndex(index => index + 1);
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
                        }));
                    }}
                    onReplayFileUploaded={replay => {
                        setCurrentTurnIndex(0);
                        setReplay(replay);
                        setReplayIndex(index => index + 1);
                    }}
                    setCurrentTurnIndex={setCurrentTurnIndex}
                />
            </div>
        </MuiThemeProvider>
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
