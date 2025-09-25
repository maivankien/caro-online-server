import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm'
import { User } from '@modules/user/entities/user.entity'
import { Room } from '@modules/room/entities/room.entity'
import { IPosition } from '../interfaces/game.interface'
import { PlayerEnum, PlayerWinnerEnum } from '@/common/enums/common.enum'

@Entity('game_history')
export class GameHistory {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string

    @Column({ name: 'room_id', type: 'char', length: 36 })
    roomId: string

    @ManyToOne(() => Room)
    @JoinColumn({ name: 'room_id' })
    room: Partial<Room>

    @Column({ name: 'player_x_id', type: 'char', length: 36 })
    playerXId: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'player_x_id' })
    playerX: Partial<User>

    @Column({ name: 'player_o_id', type: 'char', length: 36 })
    playerOId: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'player_o_id' })
    playerO: Partial<User>

    @Column({ name: 'winner_id', type: 'char', length: 36, nullable: true })
    winnerId: string | null

    @ManyToOne(() => User)
    @JoinColumn({ name: 'winner_id' })
    winner: Partial<User>

    @Column({ name: 'player_winner', type: 'enum', enum: PlayerWinnerEnum })
    playerWinner: PlayerWinnerEnum

    @Column({ name: 'winning_line', type: 'json', nullable: true })
    winningLine: IPosition[] | null

    @Column({ name: 'board', type: 'json' })
    board: (PlayerEnum | null)[][]

    @Column({ name: 'started_at', type: 'datetime' })
    startedAt: Date

    @Column({ name: 'finished_at', type: 'datetime' })
    finishedAt: Date

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt: Date
}