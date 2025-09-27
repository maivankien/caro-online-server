export const EVENT_EMITTER_CONSTANTS = {
    ROOM_JOINED: 'room.joined',
    PLAYER_READY: 'player.ready',
    GAME_START_COUNTDOWN: 'game.start.countdown',
    GAME_STARTED: 'game.started',
    GAME_MOVE_MADE: 'game.move.made',
    GAME_FINISHED: 'game.finished',
    REQUEST_REMATCH: 'request.rematch',
} as const


export const EVENT_SOCKET_CONSTANTS = {
    ERROR: 'error',
    ROOM_JOINED: 'room.joined',
    PLAYER_READY: 'player.ready',
    GET_GAME_STATE: 'get.game.state',
    GAME_STATE_SYNC: 'game.state.sync',
    GAME_START_COUNTDOWN: 'game.start.countdown',
    GAME_STARTED: 'game.started',
    GAME_MOVE_MADE: 'game.move.made',
    MAKE_MOVE: 'make.move',
    GAME_FINISHED: 'game.finished',
    REQUEST_REMATCH: 'request.rematch',
    ACCEPT_REMATCH: 'accept.rematch',
} as const