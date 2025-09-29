import { Socket } from "socket.io"

export interface IUserInfo {
    userId: string
}


export interface IMatchmakingSocketCustom extends Socket {
    data: {
        user: IUserInfo
    }
}