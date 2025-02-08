<template>
	<div>
		<div>
			<button @click="toggleFullscreen">Toggle Fullscreen</button>
			<div ref="fullscreenElement" class="fullscreen-content">
				<pre class="pt-4">
					File: {{ model.job.file?.fileName }}
					Duration: {{ model.job.duration }}
					Status: {{ modes[global.get("mode")] }}
				</pre>
			</div>
		</div>
	</div>
</template>

<script>
'use strict';

import store from "@/store";
import Vue from "vue";
import {mapState, mapGetters} from 'vuex';

export default Vue.extend ({
	computed: {
		isConnected() {
			return store.getters["isConnected"];
		},
		model() {
			return store.state.machine.model;
		},
		axes() {
			return store.state.machine.model.move.axes;
		},
		global() {
			return store.state.machine.model.global;
		},
		status() {
			return store.state.machine.model.state.status;
		},
		...mapState('settings', ['language']),
	},
	data() {
		return {
			isActive: false,
			ready: false,
			loading: false,
			errorMessage: null,

			// RLP data
			codeReply: null,
			canvas: null,
			rendering: null,
			ctx: null,
			clickerEnabled: false,
			resizeNum: null,
			refreshBed: true,
			modes: ["unhomed", "homing", "idle", "loading tank", "purging", "printing", "estop"],
		};
	},
	methods: {
		toggleFullscreen() {
			const elem = this.$refs.fullscreenElement;

			if (!document.fullscreenElement) {
				if (elem.requestFullscreen) {
				elem.requestFullscreen();
				} else if (elem.mozRequestFullScreen) { // Firefox
				elem.mozRequestFullScreen();
				} else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
				elem.webkitRequestFullscreen();
				} else if (elem.msRequestFullscreen) { // IE/Edge
				elem.msRequestFullscreen();
				}
			} else {
				if (document.exitFullscreen) {
				document.exitFullscreen();
				} else if (document.mozCancelFullScreen) { // Firefox
				document.mozCancelFullScreen();
				} else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
				document.webkitExitFullscreen();
				} else if (document.msExitFullscreen) { // IE/Edge
				document.msExitFullscreen();
				}
			}
		},
		async refresh() {
			if (!this.isConnected) {
				this.ready = false;
				this.errorMessage = null;
				return;
			}

			if (this.loading) {
				// Don't do multiple actions at once
				return;
			}
		},
	},
	activated() {
		this.isActive = true;
	},
	deactivate() {
		this.isActive = false;
	},
	async mounted() {
		if (this.isConnected) {
			this.refresh();
		}
		this.$nextTick(() => {
			this.toggleFullscreen(); // Automatically trigger fullscreen when the page renders
		});
		this.ready = true;
	},
	watch: {	},
});
</script>

<style scoped>
.fullscreen-content {
  width: 100%;
  background-color: #f4f4f4;
  color: #000000;
	position: relative;
}

</style>
