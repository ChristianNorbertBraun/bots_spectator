import {Turn} from "./replay";
import React, {Dispatch, SetStateAction} from "react";
import {Checkbox, Table, TableBody, TableCell, TableHead, TableRow} from "@material-ui/core";

export const StatsTable = (props: {
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
