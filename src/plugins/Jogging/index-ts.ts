'use strict'

import { registerRoute } from '@/routes'

import Jogging from './Jogging.vue'

// Register a route via Plugins -> Input Shaping
registerRoute(Jogging, {
	Plugins: {
		Jogging: {
			icon: 'mdi-arrow-all',
			caption: 'Jogging',
			translated: true,
			path: '/Jogging',
			viewport: 'machine'
		}
	}
});
