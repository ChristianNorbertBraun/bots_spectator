import {isFinished, Replay} from "./replay";
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {Button, InputAdornment, MenuItem, TextField} from "@material-ui/core";
import {ChevronLeft, ChevronRight, Pause, PlayArrow, SkipNext, SkipPrevious} from "@material-ui/icons";
import {makeStyles} from "@material-ui/styles";

const delayOptions = [0, 0.1, 0.2, 0.5, 1, 4];

const useStyles = makeStyles({
    buttonContainer: {
        display: "flex",
        justifyContent: "space-between",
    },
    button: {
        minWidth: "32px !important",
    },
});

export const TurnControls = (props: {
    replay: Replay,
    currentTurnIndex: number,
    delay: number,
    setDelay: (d: number) => void,
    setCurrentTurnIndex: Dispatch<SetStateAction<number>>,
}) => {
    const [turnInputValue, setTurnInputValue] = useState<string>((props.currentTurnIndex + 1).toString(10));
    const [autoplay, setAutoplay] = useState<boolean>(!isFinished(props.replay));
    const timerHandle = useRef<number>();
    const styles = useStyles();

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
        }, props.delay * 1000);
    }, [cancelTimer, nextMove, props.delay]);

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
        <div>
            <TextField
                label="Turn"
                margin="normal"
                variant="outlined"
                inputProps={{
                    min: 0,
                }}
                style={{
                    width: "4em",
                }}
                value={turnInputValue}
                onChange={e => {
                    setTurnInputValue(e.target.value);
                    const turn = parseInt(e.target.value, 10) - 1;
                    if (isNaN(turn)) return;
                    props.replay && props.setCurrentTurnIndex(Math.max(0, Math.min(parseInt(e.target.value, 10) - 1, props.replay.turns.length - 1)));
                }}
            />
            <TextField
                label="Delay"
                select
                margin="normal"
                variant="outlined"
                style={{
                    marginLeft: 8,
                    width: "6em",
                }}
                value={props.delay}
                onChange={e => {
                    const d = parseFloat(e.target.value);
                    props.setDelay(d);
                }}
                InputProps={{
                    endAdornment: <InputAdornment position="end">s</InputAdornment>,
                }}
            >
                {delayOptions.map(option => (
                    <MenuItem key={option} value={option}>
                        {"" + option}
                    </MenuItem>
                ))}
            </TextField>
        </div>
        <div className={styles.buttonContainer}>
            <Button
                color="primary"
                size="small"
                variant="contained"
                className={styles.button}
                disabled={props.currentTurnIndex <= 0}
                onClick={() => props.setCurrentTurnIndex(0)}
            >
                <SkipPrevious/>
            </Button>
            <Button
                color="primary"
                size="small"
                variant="contained"
                className={styles.button}
                disabled={props.currentTurnIndex <= 0}
                onClick={() => props.setCurrentTurnIndex(props.currentTurnIndex - 1)}
            >
                <ChevronLeft/>
            </Button>
            <Button
                color="primary"
                size="small"
                variant="contained"
                className={styles.button}
                disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
                onClick={() => autoplay ? stopAutoplay() : startAutoplay()}
            > {autoplay ? <Pause/> : <PlayArrow/>}
            </Button>
            <Button
                color="primary"
                size="small"
                variant="contained"
                className={styles.button}
                disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
                onClick={nextMove}
            >
                <ChevronRight/>
            </Button>
            <Button
                color="primary"
                size="small"
                variant="contained"
                className={styles.button}
                disabled={props.currentTurnIndex >= props.replay.turns.length - 1}
                onClick={() => props.replay && props.setCurrentTurnIndex(props.replay.turns.length - 1)}
            >
                <SkipNext/>
            </Button>
        </div>
    </>;
};
