import {Replay, Turn} from "./replay";
import React, {Dispatch, SetStateAction, useEffect, useState} from "react";
import {
    Checkbox,
    Collapse,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@material-ui/core";
import {paletteColor0} from "./palette";
import chroma from "chroma-js";

type PlayerRowData = {
    index: number;
    place?: number;
    name: string;
    score: number;
    moves: number;
    life: number;
}

export const StatsTable = (props: {
    replay: Replay,
    currentTurn: Turn,
    tracedPlayers: number[],
    setTracedPlayers: Dispatch<SetStateAction<number[]>>,
    traceStart: number,
    setTraceStart: Dispatch<SetStateAction<number>>,
}) => {
    const [traceStartInputValue, setTraceStartInputValue] = useState<string>((props.traceStart + 1).toString(10));
    const [traceCurrent, setTraceCurrent] = useState<boolean>(false);

    useEffect(() => {
        const t = traceCurrent ?
            props.currentTurn.turn - 1
            : Math.min(props.traceStart, props.currentTurn.turn - 1);
        props.setTraceStart(t);
        setTraceStartInputValue((t + 1).toString(10));
    }, [props, traceCurrent]);

    const showPlacements = props.replay.results.length > 0 && (props.currentTurn.turn === props.replay.turns[props.replay.turns.length - 1].turn);
    const players: PlayerRowData[] = showPlacements
        ? (props.replay.results.map(r => {
            const playerIndex = props.currentTurn.players.findIndex(p => p.name === r.name);
            return {
                ...r,
                life: (playerIndex >= 0 && props.currentTurn.players[playerIndex].life) || 0,
                index: playerIndex,
            };
        }))
        : props.currentTurn.players.map((p, playerIndex) => {
            return {
                ...p,
                index: playerIndex,
            };
        });

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
                {players.map((player) =>
                    <StatsTableRow
                        key={player.name}
                        player={player}
                        traced={props.tracedPlayers.indexOf(player.index) >= 0}
                        setTraced={v =>
                            props.setTracedPlayers(arr => v ? [...arr, player.index] : arr.filter(e => e !== player.index))
                        }
                    />
                )}
            </TableBody>
        </Table>
        <Collapse in={props.tracedPlayers.length > 0}>
            <div>
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
            </div>
        </Collapse>
    </div>
};

const placementColors = [
    undefined,
    paletteColor0,
    chroma(paletteColor0).alpha(0.7).hex(),
    chroma(paletteColor0).alpha(0.4).hex()
];

const StatsTableRow = (props: {
    player: PlayerRowData,
    traced: boolean,
    setTraced: (v: boolean) => void
}) => {
    const {player} = props;
    return <TableRow
        style={{
            background: player.place && placementColors[player.place],
        }}>
        <TableCell align="center">
            <Checkbox
                style={{
                    padding: 0,
                }}
                onChange={ev => {
                    props.setTraced(ev.target.checked);
                }}
                checked={props.traced}
            />
        </TableCell>
        <TableCell align="center">{player.name}</TableCell>
        <TableCell align="center">{player.life}</TableCell>
        <TableCell align="center">{player.moves}</TableCell>
        <TableCell align="center">{player.score}</TableCell>
    </TableRow>;
};
