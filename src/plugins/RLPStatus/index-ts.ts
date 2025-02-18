'use strict'

import { registerRoute } from '@/routes'

import RLPStatus from './RLPStatus.vue'

// Register a route via Plugins -> Input Shaping
registerRoute(RLPStatus, {
  Plugins: {
    RLPStatus: {
      icon: 'mdi-information',
      caption: 'Status',
      translated: true,
      path: '/Status',
      viewport: "both"
    }
  }
});
