export interface IJwtPayload {
    sub: string;
    name: string;
    isGuest: number;
    iat?: number;
    exp?: number;
}

export interface IAuthUser {
    userId: string;
    name: string;
    isGuest: number;
}

export interface ITokenResponse {
    user: {
        id: string;
        name: string;
        isGuest: number;
    };
    token: string;
}

export interface IAuthConfig {
    secret: string;
    expirationTime: string;
}
