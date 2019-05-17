import React, {useState} from 'react';
import {Header, Replay, Results, Turn} from "./reader";
import {Drawer} from "./Drawer";
import {Board} from "./Board";
import {createMuiTheme, CssBaseline, MuiThemeProvider} from "@material-ui/core";
import {makeStyles} from "@material-ui/styles";

const paletteColor0 = "#DA4A79";
// eslint-disable-next-line
const paletteColor1 = "#F27EA6";
// eslint-disable-next-line
const paletteColor2 = "#7A7EBC";
const paletteColor3 = "#272863";
const paletteColor4 = "#1B1C43";

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: {
            // light: will be calculated from palette.primary.main,
            main: paletteColor0,
            // dark: will be calculated from palette.primary.main,
            // contrastText: will be calculated to contrast with palette.primary.main
        },
        secondary: {
            // light: '#0066ff',
            main: paletteColor3,
            // dark: will be calculated from palette.secondary.main,
            // contrastText: '#ffcc00',
        },
        // error: will use the default color
        background: {
            // paper: '#fff',
            default: paletteColor4,
        },
    },
});

const useStyles = makeStyles({
    root: {
        display: 'flex',
    },
});

export const App: React.FC = () => {
    const styles = useStyles();
    const [replay, setReplay] = useState<Replay | undefined>(undefined);
    const [replayIndex, setReplayIndex] = useState(0);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [webSocket, setWebSocket] = useState<WebSocket | undefined>(undefined);

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
