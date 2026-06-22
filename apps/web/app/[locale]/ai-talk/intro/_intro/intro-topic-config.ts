import type { IntroTopicKey } from './types/intro-shell.types'

export const INTRO_TOPIC_KEYS = [
  'profile',
  'latestProject',
  'stack',
  'aiPractice',
  'ragAgent',
  'engineering',
  'collaboration',
  'hobbies',
  'writing',
  'future',
] as const satisfies readonly IntroTopicKey[]
