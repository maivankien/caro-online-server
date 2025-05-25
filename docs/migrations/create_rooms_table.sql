CREATE TABLE IF NOT EXISTS rooms (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci PRIMARY KEY COMMENT 'UUID of the room',
    name VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Name of the room',
    host_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL COMMENT 'ID of the room creator',
    player_ids JSON COMMENT 'List of player IDs in the room',
    status ENUM('waiting', 'playing', 'finished') CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT 'waiting' COMMENT 'Current status of the room',
    password VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'Room password (if any)',

    player_x_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL COMMENT 'ID of player X',
    player_o_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL COMMENT 'ID of player O',

    board_size TINYINT UNSIGNED DEFAULT 15 COMMENT 'Board size (e.g., 15x15)',
    win_condition TINYINT UNSIGNED DEFAULT 5 COMMENT 'Number of consecutive marks needed to win (usually 5)',

    game_result ENUM('none', 'player_x_win', 'player_o_win', 'draw') CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT 'none' COMMENT 'Game result',
    winner_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL COMMENT 'ID of the winner',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last updated time',

    INDEX idx_rooms_status (status),
    INDEX idx_rooms_host_id (host_id),
    INDEX idx_rooms_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Table for managing game rooms';
