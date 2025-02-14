import { registerRoute } from "@/routes";

import ObjectModelBrowser from "./ObjectModelBrowser.vue";

// Register a route via Settings -> Object Model
registerRoute(ObjectModelBrowser, {
	Plugins: {
		ObjectModel: {
			icon: "mdi-file-tree",
			caption: "Object Model Browser",
			translated: true,
			path: "/Plugins/ObjectModel",
			viewport: "both"
		}
	}
});
