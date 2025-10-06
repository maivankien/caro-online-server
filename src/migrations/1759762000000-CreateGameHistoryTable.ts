import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateGameHistoryTable1759762000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'game_history',
                columns: [
                    {
                        name: 'id',
                        type: 'char',
                        length: '36',
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: 'room_id',
                        type: 'char',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'player_x_id',
                        type: 'char',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'player_o_id',
                        type: 'char',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'winner_id',
                        type: 'char',
                        length: '36',
                        isNullable: true,
                    },
                    {
                        name: 'player_winner',
                        type: 'enum',
                        enum: ['X', 'O', 'DRAW'],
                        isNullable: false,
                    },
                    {
                        name: 'winning_line',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'board',
                        type: 'json',
                        isNullable: true,
                    },
                    {
                        name: 'started_at',
                        type: 'datetime',
                        isNullable: false,
                    },
                    {
                        name: 'finished_at',
                        type: 'datetime',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('game_history');
    }
}
