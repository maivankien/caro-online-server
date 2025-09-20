export enum RoomStatusEnum {
    WAITING = 'waiting',           // Chờ player thứ 2 join
    WAITING_READY = 'waiting_ready',// Cả 2 players đã join, chờ ready
    COUNTDOWN = 'countdown',       // Đang countdown 3-2-1
    PLAYING = 'playing',           // Game đang diễn ra
    FINISHED = 'finished',         // Game kết thúc
}

export enum GameResultEnum {
    NONE = 'none',
    PLAYER_X_WIN = 'player_x_win',
    PLAYER_O_WIN = 'player_o_win',
    DRAW = 'draw',
}
