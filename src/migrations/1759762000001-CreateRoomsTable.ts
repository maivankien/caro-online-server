import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateRoomsTable1759762000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'rooms',
                columns: [
                    {
                        name: 'id',
                        type: 'char',
                        length: '36',
                        isPrimary: true,
                        isNullable: false,
                        comment: 'UUID of the room',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '128',
                        isNullable: true,
                        comment: 'Name of the room',
                    },
                    {
                        name: 'host_id',
                        type: 'char',
                        length: '36',
                        isNullable: true,
                        comment: 'ID of the room creator',
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '32',
                        isNullable: false,
                    },
                    {
                        name: 'player_ids',
                        type: 'json',
                        isNullable: true,
                        comment: 'List of player IDs in the room',
                    },
                    {
                        name: 'board_size',
                        type: 'tinyint',
                        unsigned: true,
                        default: 15,
                        isNullable: true,
                        comment: 'Board size (e.g., 15x15)',
                    },
                    {
                        name: 'win_condition',
                        type: 'tinyint',
                        unsigned: true,
                        default: 5,
                        isNullable: true,
                        comment: 'Number of consecutive marks needed to win (usually 5)',
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: true,
                        comment: 'Creation time',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                        isNullable: true,
                        comment: 'Last updated time',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'rooms',
            new TableIndex({
                name: 'idx_rooms_host_id',
                columnNames: ['host_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('rooms');
    }
}
