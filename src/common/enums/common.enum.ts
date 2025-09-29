export enum RoomStatusEnum {
    WAITING = 'waiting',           // Chờ player thứ 2 join
    WAITING_READY = 'waiting_ready',// Cả 2 players đã join, chờ ready
    COUNTDOWN = 'countdown',       // Đang countdown 3-2-1
    PLAYING = 'playing',           // Game đang diễn ra
    FINISHED = 'finished',         // Game kết thúc
    WAITING_REMATCH = 'waiting_rematch', // Chờ player thứ 2 join rematch
}

export enum RoomTypeEnum {
    MATCHMAKING = 'matchmaking',
}

export enum PlayerWinnerEnum {
    X = 'X',
    O = 'O',
    DRAW = 'DRAW',
}

export enum PlayerEnum {
    X = 'X',
    O = 'O',
}