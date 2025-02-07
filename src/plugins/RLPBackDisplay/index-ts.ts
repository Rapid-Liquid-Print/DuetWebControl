'use strict'

import { registerRoute } from '@/routes'

import RLPBackDisplay from './RLPBackDisplay.vue'

// Register a route via Plugins -> Input Shaping
registerRoute(RLPBackDisplay, {
  Plugins: {
    RLPBackDisplay: {
      icon: 'mdi-transition',
      caption: 'RLP Back Display',
      translated: true,
      path: '/RLPBackDisplay'
    }
  }
});
