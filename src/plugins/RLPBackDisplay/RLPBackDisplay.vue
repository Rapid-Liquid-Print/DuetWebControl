<template>
	<div style="min-height: 33vh;">
		<button @click="toggleFullscreen">Toggle Fullscreen</button>
		<div ref="fullscreenElement" class="fullscreen-content">
			<div class="glowing-border" :class="statusCategory"></div>
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
					<span class="param-value animation-wrapper">
						<span class="animated-text" ref="fileNameBox">
							{{ $display(jobFile?.fileName) }}
						</span>
					</span>
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
			return store.state.machine.model.job.duration;
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
		statusCategory() {
			return this.modeCategories[this.global.get("mode")];
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
			modeCategories: ["waiting", "waiting", "waiting", "moving", "problem", "moving", "waiting", "waiting",],
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
			setTimeout(() => this.toggleJobNameAnimation(), 200); // Give the full screen time to settle
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
		toggleJobNameAnimation() {
			const elem = this.$refs.fileNameBox;
			const elemParent = elem.parentElement;
			elemParent.classList.toggle('animating', elem.getBoundingClientRect().width > elemParent.getBoundingClientRect().width)
			console.log('elem: ', elem.getBoundingClientRect().width, ', elem parent: ', elemParent.getBoundingClientRect().width)
		},
	},
	activated() {
		this.isActive = true;
		this.toggleJobNameAnimation()
	},
	deactivate() {
		this.isActive = false;
		this.toggleJobNameAnimation()
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
	watch: {
		jobFile() {
			this.toggleJobNameAnimation();
		}
	},
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap");

.fullscreen-content {
	width: 100%;
	min-height: 600px;
	background-color: #000000;
	position: relative;
	font-family: 'IBM Plex Mono', 'Courier New', Courier, monospace;
	font-weight: 400;
	font-size: 16px;
	overflow: hidden;
}

.glowing-border {
	position: absolute;
	width: 100%;
	height: calc(100% + 20px);
	animation: pulse-color 6s infinite linear;
}

.moving {
	--pulse-color: #731dd8;
}
.glowing-border.waiting {
	--pulse-color: #e3f31f;
}
.glowing-border.problem {
	--pulse-color: #d8361d;
}

@keyframes pulse-color {
	0% {
		box-shadow: inset 20px 0px 20px 0px var(--pulse-color), inset -20px 0px 20px 0px var(--pulse-color), inset 0px 20px 20px 0px var(--pulse-color);
	}
	50% {
		box-shadow: inset 15px 0px 20px 0px var(--pulse-color), inset -15px 0px 2cap 0px var(--pulse-color), inset 0px 15px 20px 0px var(--pulse-color);
	}
	100% {
		box-shadow: inset 20px 0px 20px 0px var(--pulse-color), inset -20px 0px 20px 0px var(--pulse-color), inset 0px 20px 20px 0px var(--pulse-color);
	}
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
	color: #aaaaaa;
	display: inline-block;
}

li .param-value {
	color: #eeeeee;
	display: block;
	margin-left: 20px;
}

li::before {
	display: inline-block;
	background-color: #aaaaaa;
	margin-right: 8px;
	width: 12px;
	height: 12px;
	content: "";
}

.animation-wrapper {
	position: relative;
	padding-bottom: 24px; /* compensate for the animated text because it is absolutely positioned & so its height is not considered */
	overflow: hidden;
}

.animated-text {
	position: absolute;
  animation: 10s backandforth ease-in-out infinite paused;
  white-space: nowrap;
}

.animation-wrapper.animating .animated-text {
	animation-play-state: running;
}

@keyframes backandforth {
	0%, 20%, 95%, 100% {
		left: 0%;
		transform: translate(0, 0);
	}
	60%, 75% {
		left: 100%;
		transform: translate(-100%, 0);
	}
}
</style>
