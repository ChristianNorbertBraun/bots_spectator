import {parseReplay, Replay, Turn} from "./replay";
import React, {Dispatch, SetStateAction, useRef} from "react";
import {
    Button,
    Checkbox,
    Drawer as MuiDrawer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@material-ui/core";
import {makeStyles} from "@material-ui/styles";
import {paletteColor3} from "./palette";
import {TurnControls} from "./TurnControls";

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
    connected: boolean,
    currentTurnIndex: number,
    setCurrentTurnIndex: Dispatch<SetStateAction<number>>,
    tracedPlayers: number[],
    setTracedPlayers: Dispatch<SetStateAction<number[]>>,
    onConnect: (url: string) => void,
    onReplayFileUploaded: (replay: Replay) => void,
}) => {
    const addressInputRef = useRef<HTMLInputElement>(null);

    const currentTurn = props.replay && props.replay.turns[props.currentTurnIndex];

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
                    Load file
                </Button>
            </label>
            <TextField
                disabled={props.connected}
                inputRef={addressInputRef}
                label="Host"
                defaultValue="ws://localhost:63189"
                margin="normal"
                variant="outlined"
            />
            <Button
                color="primary"
                variant="contained"
                disabled={props.connected}
                onClick={() => addressInputRef.current && props.onConnect(addressInputRef.current.value)}>
                Connect
            </Button>
            {props.replay &&
            <TurnControls
                replay={props.replay}
                currentTurnIndex={props.currentTurnIndex}
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
        </MuiDrawer>
    );
};

const PlayerTable = (props: {
    currentTurn: Turn,
    tracedPlayers: number[],
    setTracedPlayers: Dispatch<SetStateAction<number[]>>,
}) => {
    return <Table padding="none">
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
