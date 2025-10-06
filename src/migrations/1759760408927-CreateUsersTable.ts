import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsersTable1759760408927 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'char',
                        length: '36',
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '128',
                        isNullable: false,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '128',
                        isUnique: true,
                        isNullable: true,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'is_guest',
                        type: 'tinyint',
                        isNullable: false,
                        default: 1,
                    },
                    {
                        name: 'elo',
                        type: 'smallint',
                        unsigned: true,
                        isNullable: false,
                    },
                    {
                        name: 'total_games',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'wins',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'losses',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users');
    }
}
