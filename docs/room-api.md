# Room API Documentation

## Overview
Module Room cho phép người dùng tạo room và join vào room để chơi game online. Module này quản lý thông tin cơ bản của room bao gồm player assignments (X, O), kết quả game và người thắng. Logic game chi tiết sẽ được xử lý ở module khác.

## Authentication
Tất cả các endpoints đều yêu cầu JWT token trong header:
```
Authorization: Bearer <jwt_token>
```

## Room Configuration
- **2 người chơi**: Caro luôn là game 2 người chơi
- **Player assignments**: Host luôn là X, người join là O
- **Bàn cờ**: Có thể tùy chỉnh từ 10x10 đến 20x20 (mặc định 15x15)
- **Điều kiện thắng**: Có thể tùy chỉnh từ 3 đến 7 quân liên tiếp (mặc định 5)
- **Room types**: Public hoặc Private (có password)

## Endpoints

### 1. Tạo Room
**POST** `/api/rooms`

Tạo một room mới với user hiện tại làm host (sẽ là người chơi X).

**Request Body:**
```json
{
    "name": "My Room",
    "password": "optional_password",
    "isPrivate": false,
    "boardSize": 15,
    "winCondition": 5
}
```

**Response:**
```json
{
    "data": {
        "id": "room-uuid",
        "name": "My Room",
        "hostId": "user-uuid",
        "host": {
            "id": "user-uuid",
            "name": "User Name"
        },
        "playerIds": ["user-uuid"],
        "players": [
            {
                "id": "user-uuid",
                "name": "User Name",
                "symbol": "X"
            }
        ],
        "status": "waiting",
        "isPrivate": false,
        "hasPassword": true,
        "playerXId": "user-uuid",
        "playerOId": null,
        "boardSize": 15,
        "winCondition": 5,
        "gameResult": "none",
        "winnerId": null,
        "winner": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "message": "Resource created successfully",
    "statusCode": 201
}
```

### 2. Join Room
**POST** `/api/rooms/join`

Join vào một room đã tồn tại (sẽ trở thành người chơi O).

**Request Body:**
```json
{
    "roomId": "room-uuid",
    "password": "optional_password"
}
```

**Response:**
```json
{
    "data": {
        "room": {
            "id": "room-uuid",
            "name": "My Room",
            "hostId": "host-uuid",
            "host": {
                "id": "host-uuid",
                "name": "Host Name"
            },
            "playerIds": ["host-uuid", "user-uuid"],
            "players": [
                {
                    "id": "host-uuid",
                    "name": "Host Name",
                    "symbol": "X"
                },
                {
                    "id": "user-uuid",
                    "name": "User Name",
                    "symbol": "O"
                }
            ],
            "status": "waiting",
            "isPrivate": false,
            "hasPassword": true,
            "playerXId": "host-uuid",
            "playerOId": "user-uuid",
            "boardSize": 15,
            "winCondition": 5,
            "gameResult": "none",
            "winnerId": null,
            "winner": null,
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
        },
        "message": "User Name joined the room"
    },
    "message": "Resource created successfully",
    "statusCode": 201
}
```

### 3. Rời khỏi Room
**POST** `/api/rooms/leave`

Rời khỏi room hiện tại. Nếu game đang chơi, người rời sẽ thua.

**Request Body:**
```json
{
    "roomId": "room-uuid"
}
```

**Response:**
```json
{
    "data": {
        "room": {
            // Room data sau khi user rời đi
            // Nếu host rời thì room sẽ bị xóa và room = null
        },
        "message": "Left room successfully"
    },
    "message": "Resource created successfully",
    "statusCode": 201
}
```

### 4. Lấy danh sách Rooms
**GET** `/api/rooms?page=1&limit=10`

Lấy danh sách các room public đang chờ người chơi.

**Query Parameters:**
- `page` (optional): Số trang, mặc định = 1
- `limit` (optional): Số lượng room mỗi trang, mặc định = 10

**Response:**
```json
{
    "data": {
        "rooms": [
            {
                "id": "room-uuid",
                "name": "Room Name",
                "hostId": "host-uuid",
                "host": {
                    "id": "host-uuid",
                    "name": "Host Name"
                },
                "playerIds": ["host-uuid"],
                "players": [
                    {
                        "id": "host-uuid",
                        "name": "Host Name",
                        "symbol": "X"
                    }
                ],
                "status": "waiting",
                "isPrivate": false,
                "hasPassword": false,
                "playerXId": "host-uuid",
                "playerOId": null,
                "boardSize": 15,
                "winCondition": 5,
                "gameResult": "none",
                "winnerId": null,
                "winner": null,
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z"
            }
        ],
        "total": 1,
        "page": 1,
        "limit": 10
    },
    "message": "Data retrieved successfully",
    "statusCode": 200
}
```

### 5. Lấy Room hiện tại của User
**GET** `/api/rooms/current`

Lấy thông tin room mà user hiện tại đang tham gia.

**Response:**
```json
{
    "data": {
        "room": {
            // Room data hoặc null nếu user không ở trong room nào
        }
    },
    "message": "Data retrieved successfully",
    "statusCode": 200
}
```

### 6. Lấy thông tin Room theo ID
**GET** `/api/rooms/:id`

Lấy thông tin chi tiết của một room.

**Response:**
```json
{
    "data": {
        // Room data đầy đủ
    },
    "message": "Data retrieved successfully",
    "statusCode": 200
}
```

## Room Status
- `waiting`: Room đang chờ người chơi
- `playing`: Room đang trong trận đấu (được cập nhật bởi game module)
- `finished`: Room đã kết thúc (được cập nhật bởi game module)

## Game Result
- `none`: Chưa có kết quả
- `player_x_win`: Người chơi X thắng
- `player_o_win`: Người chơi O thắng
- `draw`: Hòa

## Player Symbols
- `X`: Người chơi X (luôn là host)
- `O`: Người chơi O (người join)

## Error Responses

### 400 Bad Request
```json
{
    "data": null,
    "message": "User is already in a room",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/rooms"
}
```

### 401 Unauthorized
```json
{
    "data": null,
    "message": "Unauthorized",
    "statusCode": 401,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/rooms"
}
```

### 403 Forbidden
```json
{
    "data": null,
    "message": "Invalid password",
    "statusCode": 403,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/rooms/join"
}
```

### 404 Not Found
```json
{
    "data": null,
    "message": "Room not found",
    "statusCode": 404,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/rooms/join"
}
```

## Integration với Game Module

Room module cung cấp các methods để game module có thể cập nhật trạng thái và kết quả:

```typescript
// Cập nhật trạng thái room
await roomService.updateRoomStatus(roomId, RoomStatus.PLAYING)
await roomService.updateRoomStatus(roomId, RoomStatus.FINISHED)

// Cập nhật kết quả game
await roomService.updateGameResult(roomId, GameResult.PLAYER_X_WIN, winnerId)
await roomService.updateGameResult(roomId, GameResult.DRAW)
```

## Database Schema

### Table: rooms
```sql
CREATE TABLE rooms (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    host_id CHAR(36) NOT NULL,
    player_ids JSON,
    status ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
    password VARCHAR(255) NULL,
    is_private TINYINT DEFAULT 0,
    
    -- Player assignments
    player_x_id CHAR(36) NULL,
    player_o_id CHAR(36) NULL,
    
    -- Game configuration
    board_size SMALLINT DEFAULT 15,
    win_condition SMALLINT DEFAULT 5,
    
    -- Game result
    game_result ENUM('none', 'player_x_win', 'player_o_win', 'draw') DEFAULT 'none',
    winner_id CHAR(36) NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (host_id) REFERENCES users(id),
    FOREIGN KEY (player_x_id) REFERENCES users(id),
    FOREIGN KEY (player_o_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);
``` 