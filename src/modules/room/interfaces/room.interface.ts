import { RoomStatusEnum, RoomTypeEnum } from "@/common/enums/common.enum"

export interface IRoomResponse {
    id: string
    name: string
    host: {
        id: string
        name: string
    }
    type: RoomTypeEnum
    playerIds: string[]
    status: RoomStatusEnum
    hasPassword: boolean
    boardSize: number
    winCondition: number
    createdAt: Date
}

export interface IRoomFormat {
    id: string
    name: string
    host: string
    type: RoomTypeEnum
    playerIds: string
    status: RoomStatusEnum
    password: string | null
    boardSize: number
    winCondition: number
    createdAt: number
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