'use strict'

import { registerRoute } from '@/routes'

import Info from './Info.vue'

// Register a route via Plugins -> Input Shaping
registerRoute(Info, {
	Plugins: {
		Info: {
			icon: 'mdi-information',
			caption: 'Info',
			translated: true,
			path: '/Info',
			viewport: 'machine'
		}
	}
});
