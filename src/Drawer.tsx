import {isFinished, Replay, Turn} from "./reader";
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {
    Button,
    Drawer as MuiDrawer,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@material-ui/core";
import {makeStyles} from "@material-ui/styles";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import FastRewindIcon from "@material-ui/icons/FastRewind";
import FastForwardIcon from "@material-ui/icons/FastForward";

const drawerWidth = 300;

const useStyles = makeStyles({
    root: {
        flexShrink: 0,
        width: drawerWidth,
    },
    drawerPaper: {
        width: drawerWidth,
    },
});

export const Drawer = (props: {
    replay?: Replay,
    connected: boolean,
    currentTurnIndex: number,
    onConnect: (url: string) => void,
    onReplayFileUploaded: (replay: Replay) => void,
    setCurrentTurnIndex: Dispatch<SetStateAction<number>>,
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
                paper: styles.drawerPaper,
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
                        const replay: Replay = JSON.parse(content);
                        props.onReplayFileUploaded(replay);
                    }

                }}
            />
            <label htmlFor="replayFileInput">
                <Button
                    color="primary"
                    variant="raised"
                    component="div"
                >
                    Load file
                </Button>
            </label>
            <TextField
                disabled={props.connected}
                inputRef={addressInputRef}
                label="Host"
                value="ws://localhost:63189"
                margin="normal"
                variant="outlined"
            />
            <Button
                color="primary"
                variant="raised"
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
            />
            }
        </MuiDrawer>
    );
};

const TurnControls = (props: {
    replay: Replay,
    currentTurnIndex: number,
    setCurrentTurnIndex: Dispatch<SetStateAction<number>>,
}) => {
    const [turnInputValue, setTurnInputValue] = useState<string>((props.currentTurnIndex + 1).toString(10));
    const [autoplay, setAutoplay] = useState<boolean>(!isFinished(props.replay));
    const timerHandle = useRef<number>();

    useEffect(() => {
        setTurnInputValue((props.currentTurnIndex + 1).toString(10));
    }, [props.currentTurnIndex]);

    const nextMove = useCallback(() =>
            props.setCurrentTurnIndex(currentIndex => {
                return Math.min(props.replay.turns.length - 1, currentIndex + 1)
            })
        , [props]);

    const canNextMove = useCallback(() => props.currentTurnIndex < props.replay.turns.length - 1,
        [props]);

    const cancelTimer = useCallback(() => {
        if (timerHandle.current !== undefined) {
            window.clearInterval(timerHandle.current);
        }
        timerHandle.current = undefined;
    }, []);

    const startTimer = useCallback(() => {
        cancelTimer();
        timerHandle.current = window.setTimeout(() => {
            console.log("Timer triggered, nextMove()");
            timerHandle.current = undefined;
            nextMove();
        }, 500);
    }, [cancelTimer, nextMove]);

    const startAutoplay = () => {
        cancelTimer();
        setAutoplay(true);
    };

    const stopAutoplay = () => {
        cancelTimer();
        setAutoplay(false);
    };

    useEffect(() => {
        // console.log(`TurnControls#useEffect, autoplay: ${autoplay}, canNextMove():${canNextMove()}, currentTurnIndex:${props.currentTurnIndex}, props.replay.turns.length: ${props.replay.turns.length}, timerHandle.current: ${timerHandle.current}`);

        if (autoplay && !canNextMove()) {
            cancelTimer();
            if (isFinished(props.replay)) {
                setAutoplay(false);
            }
        } else if (autoplay && timerHandle.current === undefined && canNextMove()) {
            startTimer();
        }
    }, [autoplay, startTimer, cancelTimer, nextMove, canNextMove, props.currentTurnIndex, props.replay]);

    // console.log(`TurnControls#render, autoplay: ${autoplay}, currentTurnIndex:${props.currentTurnIndex}, timerHandle.current: ${timerHandle.current}`);
    return <>
        <TextField
            type="number"
            inputProps={{
                min: 0,
            }}
            label="Turn"
            margin="normal"
            variant="outlined"
            value={turnInputValue}
            onChange={e => {
                setTurnInputValue(e.target.value);
                const turn = parseInt(e.target.value, 10) - 1;
                if (isNaN(turn)) return;
                props.replay && props.setCurrentTurnIndex(Math.max(0, Math.min(parseInt(e.target.value, 10) - 1, props.replay.turns.length - 1)));
            }}
        />
        <div>
            <IconButton
                disabled={props.currentTurnIndex <= 0}
                onClick={() => props.setCurrentTurnIndex(0)}
            >
                <SkipPreviousIcon/>
            </IconButton>
            <IconButton
                disabled={props.currentTurnIndex <= 0}
                onClick={() => props.setCurrentTurnIndex(props.currentTurnIndex - 1)}
            >
                <FastRewindIcon/>
            </IconButton>
            <IconButton
                disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
                onClick={() => autoplay ? stopAutoplay() : startAutoplay()}
            > {autoplay ? <PauseIcon/> : <PlayArrowIcon/>}
            </IconButton>
            <IconButton
                disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
                onClick={nextMove}
            >
                <FastForwardIcon/>
            </IconButton>
            <IconButton
                disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
                onClick={() => props.replay && props.setCurrentTurnIndex(props.replay.turns.length - 1)}
            >
                <SkipNextIcon/>
            </IconButton>
        </div>
    </>;
};

const PlayerTable = (props: {
    currentTurn: Turn,
}) => {
    return <Table>
        <TableHead>
            <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Life</TableCell>
                <TableCell>Move</TableCell>
                <TableCell>Score</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {props.currentTurn.players.map(player =>
                <TableRow key={player.name}>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.life}</TableCell>
                    <TableCell>{player.moves}</TableCell>
                    <TableCell>{player.score}</TableCell>
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
