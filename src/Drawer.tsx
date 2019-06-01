import {isFinished, Replay} from "./replay";
import React, {Dispatch, SetStateAction, useRef, useState} from "react";
import {Button, Collapse, Drawer as MuiDrawer, TextField, Typography} from "@material-ui/core";
import {makeStyles} from "@material-ui/styles";
import {paletteColor3} from "./palette";
import {TurnControls} from "./TurnControls";
import * as FileSaver from 'file-saver';
import {StatsTable} from "./StatsTable";

const drawerWidth = 320;

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
    onReplayFileUploaded: (content: string) => void,
    mode3d: boolean,
    setMode3d: (mode3d: boolean) => void,
    traceStart: number,
    setTraceStart: Dispatch<SetStateAction<number>>,
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
                        props.onReplayFileUploaded(content);
                    }

                }}
            />
            <label htmlFor="replayFileInput">
                <Button
                    color="primary"
                    variant="contained"
                    component="div"
                    style={{
                        width: "100%",
                    }}
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
            <div
                style={{
                    marginBottom: 16,
                }}
            />
            <Collapse in={props.replay !== undefined}>
                <span>
                    {props.replay &&
                    <TurnControls
                        replay={props.replay}
                        currentTurnIndex={props.currentTurnIndex}
                        delay={delay}
                        setDelay={setDelay}
                        setCurrentTurnIndex={props.setCurrentTurnIndex}
                        mode3d={props.mode3d}
                        setMode3d={props.setMode3d}
                    />}
                </span>
                {currentTurn &&
                <StatsTable
                    currentTurn={currentTurn}
                    tracedPlayers={props.tracedPlayers}
                    setTracedPlayers={props.setTracedPlayers}
                    traceStart={props.traceStart}
                    setTraceStart={props.setTraceStart}
                />
                }
                {props.replay && isFinished(props.replay) &&
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
                }
            </Collapse>
        </MuiDrawer>
    );
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
