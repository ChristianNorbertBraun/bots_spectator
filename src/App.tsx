import React, {useEffect, useState} from 'react';
import {Header, parseReplay, Replay, Results, Turn} from "./replay";
import {Drawer} from "./Drawer";
import {Board} from "./Board";
import {createMuiTheme, CssBaseline, Dialog, DialogTitle, Slide} from "@material-ui/core";
import {makeStyles, ThemeProvider} from "@material-ui/styles";
import {paletteColor0, paletteColor2, paletteColor3, paletteColor5} from "./palette";
import {ErrorMessage, isErrorMessage} from "./errors";
import {TransitionProps} from "@material-ui/core/transitions";

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

async function tryToLoadReplayFromUrl(): Promise<string | undefined> {
    const params = new URLSearchParams(document.location.search);
    const replayUrl = params.get('replay_url');
    if (!replayUrl) return undefined;
    const response = await fetch(replayUrl);
    return response.text();
}

const ErrorDialogTransition = React.forwardRef<unknown, TransitionProps>(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const App: React.FC = () => {
    const styles = useStyles();
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined);
    const [tracedPlayers, setTracedPlayers] = useState<number[]>([]);
    const [traceStart, setTraceStart] = useState<number>(0);
    const [mode3d, setMode3d] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>(undefined);

    const handleReplay = (content: string) => {
        const result = parseReplay(content);
        if (typeof result === "string") {
            setError(result);
        } else {
            if (result.warning) {
                setError(result.warning);
            }
            setWebSocket(ws => {
                if (ws) ws.close();
                return undefined;
            });
            setCurrentTurnIndex(0);
            setReplay(result.replay);
        }
    };

    useEffect(() => {
        tryToLoadReplayFromUrl().then(s => {
            if (s) handleReplay(s);
        });
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Dialog
                open={error !== undefined}
                onClose={() => setError(undefined)}
                TransitionComponent={ErrorDialogTransition}
            >
                <DialogTitle>
                    {error}
                </DialogTitle>
            </Dialog>
            <div className={styles.root}>
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                    }}>
                    {replay &&
                    <Board
                        replay={replay}
                        currentTurnIndex={currentTurnIndex}
                        tracedPlayers={tracedPlayers}
                        traceStart={traceStart}
                        mode3d={mode3d}
                    />
                    }
                    <Slide direction="up" in={replay === undefined} timeout={{enter: 0, exit: 500}}>
                        <div
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                top: 0,
                                left: 0,
                                background: `url(BotsSticker.svg) no-repeat top`,
                            }}
                        />
                    </Slide>
                </div>

                <Drawer
                    replay={replay}
                    webSocket={webSocket}
                    currentTurnIndex={currentTurnIndex}
                    setCurrentTurnIndex={setCurrentTurnIndex}
                    tracedPlayers={tracedPlayers}
                    setTracedPlayers={setTracedPlayers}
                    mode3d={mode3d}
                    setMode3d={setMode3d}
                    traceStart={traceStart}
                    setTraceStart={setTraceStart}
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
                            },
                            onError: (message: string) => {
                                setError(message);
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
                    onReplayFileUploaded={handleReplay}
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
    onError: (message: string) => void;
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
                if (!messageData.mode) {
                    listener.onError("Warning: Header is missing mode-field - you're probably connected to an old bots version, using default sprites.");
                }
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
