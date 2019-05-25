import React, {useEffect, useState} from 'react';
import {Header, Replay, Results, Turn} from "./replay";
import {Drawer} from "./Drawer";
import {Board} from "./Board";
import {createMuiTheme, CssBaseline, Dialog, DialogTitle} from "@material-ui/core";
import {makeStyles, ThemeProvider} from "@material-ui/styles";
import {paletteColor0, paletteColor2, paletteColor3, paletteColor5} from "./palette";
import {ErrorMessage, isErrorMessage} from "./errors";

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: {
            main: paletteColor0,
        },
        secondary: {
            main: paletteColor2,
        },
        background: {
            default: paletteColor5,
        },
    },
    overrides: {
        MuiPaper: {
            root: {
                backgroundColor: paletteColor3,
            },
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
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined);
    const [tracedPlayers, setTracedPlayers] = useState<number[]>([]);
    const [mode3d, setMode3d] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        tryToLoadReplayFromUrl().then(setReplay);
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Dialog
                open={error !== undefined}
                onClose={() => setError(undefined)}
            >
                <DialogTitle>
                    {error}
                </DialogTitle>
            </Dialog>
            <div className={styles.root}>
                {replay &&
                <Board
                    replay={replay}
                    currentTurnIndex={currentTurnIndex}
                    tracedPlayers={tracedPlayers}
                    mode3d={mode3d}
                />
                }
                <Drawer
                    replay={replay}
                    webSocket={webSocket}
                    currentTurnIndex={currentTurnIndex}
                    setCurrentTurnIndex={setCurrentTurnIndex}
                    tracedPlayers={tracedPlayers}
                    setTracedPlayers={setTracedPlayers}
                    mode3d={mode3d}
                    setMode3d={setMode3d}
                    onConnectWebsocket={async url => {
                        const websocketResult = await createSpectatorWebsocket(url, {
                            onHeader: (header: Header) => {
                                setReplay({...header, turns: [], results: []});
                            },
                            onTurn: (turn: Turn) => {
                                setReplay(replay => {
                                    return {...replay!!, turns: [...replay!!.turns, turn]}
                                });
                            },
                            onResults: (results: Results) => {
                                setReplay(replay => {
                                    return {...replay!!, ...results};
                                });
                            },
                            onDisconnect: () => {
                                setWebSocket(undefined);
                            }
                        });

                        if (isErrorMessage(websocketResult)) {
                            setError(websocketResult.message);
                            return;
                        } else {
                            setWebSocket(websocketResult);
                        }
                        setCurrentTurnIndex(0);
                        setReplay(undefined);
                    }}
                    onCloseWebsocket={() =>
                        setWebSocket(ws => {
                            if (ws) {
                                ws.close();
                            }
                            return undefined;
                        })
                    }
                    onReplayFileUploaded={replay => {
                        setWebSocket(ws => {
                            if (ws) {
                                ws.close();
                            }
                            return undefined;
                        });
                        setCurrentTurnIndex(0);
                        setReplay(replay);
                    }}
                />
            </div>
        </ThemeProvider>
    );
};

interface SpectatorListener {
    onHeader: (header: Header) => void;
    onTurn: (turn: Turn) => void;
    onResults: (results: Results) => void;
    onDisconnect: () => void;
}

async function createSpectatorWebsocket(url: string, listener: SpectatorListener): Promise<WebSocket | ErrorMessage> {
    return new Promise((resolve, reject) => {
        const webSocket = new WebSocket(url);
        webSocket.onopen = ev => {
            resolve(webSocket);
        };
        webSocket.onerror = ev => {
            resolve({
                message: `Error establishing WebSocket to ${url}`
            });
        };
        webSocket.onmessage = message => {
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
        };
        webSocket.onclose = listener.onDisconnect;
        return webSocket;
    });
}
