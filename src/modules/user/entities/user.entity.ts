import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @Column({ type: 'varchar', length: 128 })
    name: string;

    @Column({ type: 'varchar', length: 128, nullable: true })
    email: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password: string | null;

    @Column({ name: 'is_guest', type: 'tinyint', default: 1 })
    isGuest: number;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
    updatedAt: Date;
}
