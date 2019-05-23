import {isFinished, parseReplay, Replay, Turn} from "./replay";
import React, {Dispatch, SetStateAction, useRef, useState} from "react";
import {
    Button,
    Checkbox,
    Drawer as MuiDrawer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@material-ui/core";
import {makeStyles} from "@material-ui/styles";
import {paletteColor3} from "./palette";
import {TurnControls} from "./TurnControls";
import * as FileSaver from 'file-saver';

const drawerWidth = 300;

const useStyles = makeStyles({
    root: {
        flexShrink: 0,
        width: drawerWidth,
    },
    paper: {
        width: drawerWidth,
        background: `${paletteColor3} !important`,
        padding: 30,
        borderTopLeftRadius: 30,
        borderBottomLeftRadius: 30,
        border: "none !important",
    },
});

export const Drawer = (props: {
    replay?: Replay,
    webSocket?: WebSocket,
    currentTurnIndex: number,
    setCurrentTurnIndex: Dispatch<SetStateAction<number>>,
    tracedPlayers: number[],
    setTracedPlayers: Dispatch<SetStateAction<number[]>>,
    onConnectWebsocket: (url: string) => Promise<void>,
    onCloseWebsocket: () => void,
    onReplayFileUploaded: (replay: Replay) => void,
}) => {
    const addressInputRef = useRef<HTMLInputElement>(null);

    const currentTurn = props.replay && props.replay.turns[props.currentTurnIndex];
    const [delay, setDelay] = useState(0.1);

    const styles = useStyles();

    return (
        <MuiDrawer
            variant="permanent"
            anchor="right"
            className={styles.root}
            classes={{
                paper: styles.paper,
            }}
        >
            <div
                style={{
                    marginBottom: 16,
                }}
            >
                <input
                    id="replayFileInput"
                    type="file"
                    style={{
                        display: 'none',
                    }}
                    onChange={async e => {
                        e.preventDefault();
                        if (e.target.files != null && e.target.files.length > 0) {
                            const file: File = e.target.files[0];
                            e.target.value = ''; // Reset value, so user may upload the same filename again
                            const content = await readFileContents(file);
                            const replay = parseReplay(content);
                            props.onReplayFileUploaded(replay);
                        }

                    }}
                />
                <label htmlFor="replayFileInput">
                    <Button
                        color="primary"
                        variant="contained"
                        component="div"
                    >
                        Load replay
                    </Button>
                </label>
                {props.webSocket
                    ? <>
                        <Typography variant="body1" style={{
                            marginTop: 16,
                        }}>
                            Connected to {props.webSocket.url}
                        </Typography>
                        <Button
                            color="secondary"
                            variant="contained"
                            onClick={props.onCloseWebsocket}
                            style={{
                                marginBottom: 8,
                            }}
                        >
                            Disconnect
                        </Button>
                    </>
                    : <>
                        <TextField
                            inputRef={addressInputRef}
                            label="Host"
                            defaultValue="ws://localhost:63189"
                            margin="normal"
                            variant="outlined"
                        />
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={() => addressInputRef.current && props.onConnectWebsocket(addressInputRef.current.value)}>
                            Connect
                        </Button>
                    </>}
            </div>
            {props.replay &&
            <TurnControls
                replay={props.replay}
                currentTurnIndex={props.currentTurnIndex}
                delay={delay}
                setDelay={setDelay}
                setCurrentTurnIndex={props.setCurrentTurnIndex}
            />
            }
            {currentTurn &&
            <PlayerTable
                currentTurn={currentTurn}
                tracedPlayers={props.tracedPlayers}
                setTracedPlayers={props.setTracedPlayers}
            />
            }
            {props.replay && isFinished(props.replay) &&
            <>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                        const blob = new Blob([JSON.stringify(props.replay)], {
                            type: "application/json;charset=utf-8",
                        });
                        FileSaver.saveAs(blob, "replay.json");
                    }
                    }
                >
                    Download replay
                </Button>
            </>
            }
        </MuiDrawer>
    );
};

const PlayerTable = (props: {
    currentTurn: Turn,
    tracedPlayers: number[],
    setTracedPlayers: Dispatch<SetStateAction<number[]>>,
}) => {
    return <Table
        padding="none"
        style={{
            marginBottom: 24,
        }}
    >
        <TableHead>
            <TableRow>
                <TableCell align="center">Trace</TableCell>
                <TableCell align="center">Name</TableCell>
                <TableCell align="center">Life</TableCell>
                <TableCell align="center">Move</TableCell>
                <TableCell align="center">Score</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {props.currentTurn.players.map((player, index) =>
                <TableRow key={player.name}>
                    <TableCell align="center">
                        <Checkbox
                            color="primary"
                            style={{
                                padding: 0,
                            }}
                            onChange={ev => {
                                props.setTracedPlayers(arr => ev.target.checked ? [...arr, index] : arr.filter(e => e !== index));
                            }}
                            checked={props.tracedPlayers.indexOf(index) >= 0}
                        />
                    </TableCell>
                    <TableCell align="center">{player.name}</TableCell>
                    <TableCell align="center">{player.life}</TableCell>
                    <TableCell align="center">{player.moves}</TableCell>
                    <TableCell align="center">{player.score}</TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
};

async function readFileContents(file: File): Promise<string> {
    return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (event) {
            const contents = reader.result!! as string;
            resolve(contents);
        };
    });
}
