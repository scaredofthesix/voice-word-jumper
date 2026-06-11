export type GameState = 'START_SCREEN' | 'PLAYING' | 'COLLIDED' | 'GAME_OVER';

export interface WordData {
  word: string;
  translation: string;
  speakCount: number;
  struggleCount: number;
}

export interface WordCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  words: Omit<WordData, 'speakCount' | 'struggleCount'>[];
}

export type Lane = 0 | 1 | 2; // Left, Center, Right

export type TrackStyle = 'forest' | 'night' | 'desert' | 'city';


export interface Obstacle {
  id: string;
  lane: Lane;
  y: number; // 0 to 100 percentage or canvas pixels
  speed: number;
  type: 'truck' | 'police' | 'taxi' | 'sedan' | 'cone' | 'puddle';
  color: string;
}

export interface Sparkle {
  id: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

export interface VoiceStatus {
  status: 'unsupported' | 'idle' | 'listening' | 'matched' | 'error';
  message: string;
}
