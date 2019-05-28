import {Turn} from "./replay";
import React, {Dispatch, SetStateAction, useEffect, useState} from "react";
import {
    Checkbox,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@material-ui/core";

export const StatsTable = (props: {
    currentTurn: Turn,
    tracedPlayers: number[],
    setTracedPlayers: Dispatch<SetStateAction<number[]>>,
    traceStart: number,
    setTraceStart: Dispatch<SetStateAction<number>>,
}) => {
    const [traceStartInputValue, setTraceStartInputValue] = useState<string>((props.traceStart + 1).toString(10));
    const [traceCurrent, setTraceCurrent] = useState<boolean>(false);

    useEffect(() => {
        // Need to get reference here to help the linter tool `exhaustive-deps`
        const setTraceStart = props.setTraceStart;
        if (traceCurrent) {
            setTraceStartInputValue(props.currentTurn.turn.toString(10));
            setTraceStart(props.currentTurn.turn - 1);
        } else {
            setTraceStartInputValue(v => {
                const t = parseInt(v, 10);
                const t2 = isNaN(t) ? props.currentTurn.turn : Math.min(t, props.currentTurn.turn);
                return t2.toString(10);
            });
        }
    }, [props.currentTurn.turn, traceCurrent, props.setTraceStart]);

    // console.log(`StatsTable#render traceStartInputValue:${traceStartInputValue}, traceStart: ${props.traceStart}, currentTurn: ${props.currentTurn.turn}`);
    return <div
        style={{
            marginBottom: 24,
        }}
    >
        <Table
            padding="none"
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
        {props.tracedPlayers.length > 0 && <div>
            <TextField
                label="Trace Start"
                margin="normal"
                variant="outlined"
                inputProps={{
                    min: 0,
                }}
                style={{
                    width: "6em",
                }}
                disabled={traceCurrent}
                value={traceStartInputValue}
                onChange={e => {
                    setTraceStartInputValue(e.target.value);
                    const turn = parseInt(e.target.value, 10) - 1;
                    if (isNaN(turn)) return;
                    props.setTraceStart(Math.max(0, Math.min(turn, props.currentTurn.turn - 1)));
                }}
                onBlur={_ => {
                    setTraceStartInputValue(v => {
                        const t = parseInt(v, 10);
                        const t2 = isNaN(t) ? props.currentTurn.turn : Math.min(t, props.currentTurn.turn);
                        return t2.toString(10);
                    });
                }}
            />
            <FormControlLabel
                style={{
                    marginTop: 24,
                    marginLeft: 0,
                }}
                label="Current turn"
                control={<Checkbox
                    checked={traceCurrent}
                    onChange={ev => setTraceCurrent(ev.target.checked)}
                />}
            />
        </div>}
    </div>
};
