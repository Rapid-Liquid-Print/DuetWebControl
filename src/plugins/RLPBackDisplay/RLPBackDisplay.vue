<template>
	<div style="min-height: 33vh;">
		<button @click="toggleFullscreen">Toggle Fullscreen</button>
		<div ref="fullscreenElement" class="fullscreen-content">
			<ul class="print-info" style="float: left;">
				<li>
					<span class="param-name">STATUS</span>
					<span class="param-value">{{ status }}</span>
				</li>

				<li>
					<span class="param-name">TOTAL PART VOLUME</span>
					<span class="param-value">{{ $displayVolume(undefined, 0) }}</span>
				</li>

				<li>
					<span class="param-name">EXTRUDED AMOUNT</span>
					<span class="param-value" v-for="(extruder, index) in extruderData" :key="index">
						{{ ["A","B","A2","B2"][index] }}: {{ $displayVolume(model.move.extruders[index].position, 0) }}
					</span>
				</li>
			</ul>

			<div class="tank-outline"></div>

			<ul class="print-info" style="float: right;">
				<li>
					<span class="param-name">CURRENT JOB</span>
					<span class="param-value">{{ $display(jobFile?.fileName) }}</span>
				</li>

				<li>
					<span class="param-name">POSITION</span>
					<span class="param-value" v-for="axis in axes">
						{{ axis.letter }} : {{ $displayAxisPosition(axis, true) }}
					</span>
				</li>

				<li>
					<span class="param-name">MOVE SPEED</span>
					<span class="param-value">{{ $displayMoveSpeed(currentMove.requestedSpeed) }}</span>
				</li>

				<li>
					<span class="param-name">EXTRUSION RATE</span>
					<span class="param-value">{{ $displayExtrusionRate(currentMove.extrusionRate) }}</span>
				</li>

				<li>
					<span class="param-name">TIME ELAPSED</span>
					<span class="param-value">{{ $displayTime(timeSoFar) }}</span>
				</li>

				<li>
					<span class="param-name">TIME REMAINING</span>
					<span class="param-value">{{ $displayTime(timeLeft) }}</span>
				</li>
			</ul>
		</div>
	</div>
</template>

<script>
'use strict';

import store from "@/store";
import Vue from "vue";
import { isPrinting } from "@/utils/enums";

export default Vue.extend({
	computed: {
		isConnected() {
			return store.getters["isConnected"];
		},
		jobFile() {
			return store.state.machine.model.job.file;
		},
		model() {
			return store.state.machine.model;
		},
		currentMove() {
			return store.state.machine.model.move.currentMove
		},
		timeLeft() {
			return store.state.machine.model.job.timesLeft.file;
		},
		timeSoFar() {
			return isPrinting(store.state.machine.model.state.status) ? store.state.machine.model.job.duration : store.state.machine.model.job.lastDuration;
		},
		axes() {
			return store.state.machine.model.move.axes;
		},
		extruderData() {
			const extrNum = store.state.machine.model.global.get("extruder_num");
			return store.state.machine.model.move.extruders.slice(0, extrNum);
		},
		global() {
			return store.state.machine.model.global;
		},
		status() {
			return this.modes[this.global.get("mode")];
		},
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
			modes: ["unhomed", "homing", "idle", "moving", "estop", "purging", "status", "loading tank",],
			extruders: ["A ", "B ", "A2", "B2"],
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
			// Auto-full screen on hot-reload triggers a "Permission denied error"
			// https://stackoverflow.com/questions/9454125/javascript-request-fullscreen-is-unreliable
			// TODO: See whether this applies when built for production
			// TODO: Consider wrapping the auto-fullscreen request into a href call: https://stackoverflow.com/a/10074378
			this.toggleFullscreen(); // Automatically trigger fullscreen when the page renders
		});
		this.ready = true;
	},
	watch: {},
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap");

.fullscreen-content {
	width: 100%;
	min-height: 600px;
	background-color: #f4f4f4;
	position: relative;
	font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
	font-weight: 400;
	font-size: 16px;
}

.tank-outline {
	position: absolute;
	width: calc(50 / 95 * 100%);
	height: calc(50 / 54 * 100%);
	background-color: white;
	bottom: 0;
	left: 50%;
	transform: translate(-50%, 0);
}

ul.print-info {
	list-style: none;
	width: calc((95 - 50) / 95 * 100% / 2);
	margin-top: calc((54 - 50) / 95 * 100%);
	padding: 0 48px;
}

li {
	margin-top: 24px;
}

li .param-name {
	color: #888888;
	display: inline-block;
}

li .param-value {
	color: #333333;
	display: block;
  margin-left: 20px;
}

li::before {
	display: inline-block;
	background-color: #888888;
	margin-right: 8px;
	width: 12px;
	height: 12px;
	content: "";
}
</style>
