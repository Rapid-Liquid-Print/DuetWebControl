'use strict'

import { registerRoute } from '@/routes'

import Purging from './Purging.vue'

// Register a route via Plugins -> Purging
registerRoute(Purging, {
	Plugins: {
		Purging: {
			icon: 'mdi-water-outline',
			caption: 'Purge',
			translated: true,
			path: '/Purging',
			viewport: 'machine'
		}
	}
});
