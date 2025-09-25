import { PlayerEnum, PlayerWinnerEnum } from "@/common/enums/common.enum"


export interface IGameState {
    id: string
    board: (PlayerEnum | null)[][]
    currentPlayer: PlayerEnum
    isGameActive: boolean
    moveCount: number
    winCondition: number
    playerXId: string
    playerOId: string
    lastMoveTime?: string
    startTime: string
    finishedAt?: string
}

export interface IGameMove {
    row: number
    col: number
    player: PlayerEnum
    timestamp: string
}

export interface IGameCountdownPayload {
    roomId: string
    countdown: number
}

export interface IGameStartedPayload {
    roomId: string
    gameState: IGameState
    players: IPlayerAssignment
}

export interface IGameMovePayload {
    roomId: string
    move: IGameMove
    gameState: IGameState
}

export interface IGameFinishedPayload {
    roomId: string
    winner: PlayerWinnerEnum
    winningLine?: IPosition[]
    gameState: IGameState
}

export interface IPlayerAssignment {
    playerXId: string
    playerOId: string
}

export interface IPlayerReadyStatus {
    playerXId: string
    playerOId: string
    playerXReady: boolean
    playerOReady: boolean
    bothReady: boolean
}

export interface IPosition {
    row: number
    col: number
}

export interface IMakeMoveDto {
    row: number
    col: number
}


export interface IGameStateSyncPayload {
    gameState: IGameState
    players: IPlayerAssignment
    winner?: PlayerWinnerEnum | null
    winningLine?: IPosition[]
}
