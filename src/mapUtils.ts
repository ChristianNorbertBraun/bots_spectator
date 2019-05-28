import {Turn} from "./replay";
import {Dimension} from "./geom";

type BitSet = boolean[];

function addPlayerViewToSet(result: BitSet, mapDim: Dimension, posx: number, posy: number, radius: number,) {
    for (let x = posx - radius; x <= posx + radius; ++x) {
        for (let y = posy - radius; y <= posy + radius; ++y) {
            const xx = (x + mapDim.width) % mapDim.width;
            const yy = (y + mapDim.height) % mapDim.height;
            result[xx + yy * mapDim.width] = true;
        }
    }
    return result;
}

export function calcSeenFields(
    props: {
        mapDim: Dimension,
        turns: Turn[],
        tracedPlayers: number[],
        viewRadius: number,
    }): BitSet {
    const result = new Array(props.mapDim.width * props.mapDim.height).fill(false);
    for (const turn of props.turns) {
        for (const playerIndex of props.tracedPlayers) {
            const player = turn.players[playerIndex];
            addPlayerViewToSet(result, props.mapDim, player.x, player.y, props.viewRadius);
        }
    }
    return result;
}
