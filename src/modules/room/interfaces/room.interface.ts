import { RoomStatusEnum } from "@common/enums/room.enum"

export interface IRoomResponse {
    id: string
    name: string
    host: {
        id: string
        name: string
    }
    status: RoomStatusEnum
    hasPassword: boolean
    boardSize: number
    winCondition: number
    createdAt: Date
}

export interface IRoomListResponse {
    rooms: IRoomResponse[]
    total: number
    page: number
    limit: number
}

export interface IJoinRoomResponse {
    room: IRoomResponse
    message: string
} 