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
import { RoomStatusEnum, GameResultEnum } from '@/common/enums/common.enum';


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

    @Column({ type: 'enum', enum: RoomStatusEnum, default: RoomStatusEnum.WAITING })
    status: RoomStatusEnum

    @Column({ type: 'varchar', length: 255, nullable: true })
    password: string | null

    // Player assignments
    @Column({ name: 'player_x_id', type: 'char', length: 36, nullable: true })
    playerXId: string | null

    @Column({ name: 'player_o_id', type: 'char', length: 36, nullable: true })
    playerOId: string | null

    // Game configuration (không thay đổi trong quá trình chơi)
    @Column({ name: 'board_size', type: 'int', default: 15 })
    boardSize: number

    @Column({ name: 'win_condition', type: 'int', default: 5 })
    winCondition: number

    // Game result
    @Column({ name: 'game_result', type: 'enum', enum: GameResultEnum, default: GameResultEnum.NONE })
    gameResult: GameResultEnum

    @Column({ name: 'winner_id', type: 'char', length: 36, nullable: true })
    winnerId: string | null

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
    updatedAt: Date
} 