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

export interface Header {
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
