// src/main.ts

import { NodeRuntime } from '@effect/platform-node'
import { Layer } from 'effect'
import { HttpLive } from './composition'

// ============================================
// SERVER ENTRY POINT
// ============================================

NodeRuntime.runMain(Layer.launch(HttpLive))
