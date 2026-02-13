// src/main.ts

import { Layer } from 'effect'
import { NodeRuntime } from '@effect/platform-node'

import { HttpLive, LoggerLive } from './composition'

// ============================================
// SERVER ENTRY POINT
// ============================================

const MainLive = HttpLive
  .pipe(Layer.provide(LoggerLive))

NodeRuntime.runMain(Layer.launch(MainLive))
