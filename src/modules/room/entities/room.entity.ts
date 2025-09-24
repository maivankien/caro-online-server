import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '@modules/user/entities/user.entity';


@Entity('rooms')
export class Room {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string

    @Column({ type: 'varchar', length: 128 })
    name: string

    @Column({ name: 'host_id', type: 'char', length: 36 })
    hostId: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'host_id' })
    host: Partial<User>

    @Column({ name: 'player_ids', type: 'json', nullable: true })
    playerIds: string[]

    @Column({ name: 'board_size', type: 'int' })
    boardSize: number

    @Column({ name: 'win_condition', type: 'int' })
    winCondition: number

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
    updatedAt: Date
} 