import { PlayerEnum } from "@/common/enums/common.enum";

export type Direction = [number, number];

export type ScoresByDirection = Record<string, number[]>;

export type SumCol = { [score: number]: Record<string, number> };

export type FinalScores = { [score: number]: number };


export type Board = (PlayerEnum | null)[][];