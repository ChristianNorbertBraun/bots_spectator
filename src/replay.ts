export interface Turn {
    turn: number;
    players: Player[];
    map: string;
}

export interface Player {
    addr: string;
    name: string;
    x: number;
    y: number;
    bearing: string;
    life: number;
    moves: number;
    score: number;
}

export enum GameMode {
    training = "training",
    escape = "escape",
    collect = "collect",
    snakes = "snakes",
    rumble = "rumble",
    avoid = "avoid",
    word = "word",
    boom = "boom",
    horde = "horde"
}

export interface Header {
    mode?: GameMode;
    max_turns: number;
    map_width: number;
    map_height: number;
    view_radius: number;
}

export interface Replay extends Header {
    turns: Turn[];
    results: Placement[];
}

export interface Placement {
    place: number;
    addr: string;
    name: string;
    score: number;
    moves: number;
    killer: string;
}

export interface Results {
    results: Placement[];
}

export const isFinished = (replay: Replay) => replay.results.length > 0;

interface ReplayParseResult {
    replay: Replay;
    warning?: string;
}

export function parseReplay(content: string): ReplayParseResult | string {
    try {
        const replay = JSON.parse(content);
        if (!replay.mode) {
            return {
                replay,
                warning: "Warning: Replay is missing mode-field - it's probably from an old bots version, using default sprites.",
            };
        }
        return replay;
    } catch (e) {
        return e.toString();
    }
}
