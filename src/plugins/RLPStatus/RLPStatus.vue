<template>
	<div>
		<v-row :dense="$vuetify.breakpoint.mobile">
			<v-col cols="12" sm="6" md="5" lg="5" xl="5">
				<status-panel style="height: 100%"/>
			</v-col>

			<v-col>
				<v-card>
					<v-card-title class="py-2">
						<v-icon small class="mr-1">mdi-wrench</v-icon>
						{{ $t("panel.jobControl.caption") }}
					</v-card-title>

					<v-card-text class="pt-0">
						<!-- Clean purge at print end -->
						<div>
							<v-switch
								v-model="shouldRunCleanPurge"
								@change="sendCode('set global.cleanPurge = !global.cleanPurge')"
								inset
								label="Clean Purge At End"
							/>
						</div>

						<!-- Pause/Cancel print -->
						<div style="max-width: 432px">
							<code-btn color="warning" block :disabled="uiFrozen || !isPrinting || isPausing || isCancelling"
										:code="isPaused ? 'M24' : 'M25'" tabindex="0">
								<v-icon class="mr-1">{{ isPaused ? 'mdi-play' : 'mdi-pause' }}</v-icon>
								{{ pauseResumeText }}
							</code-btn>

							<code-btn v-if="isPaused" block :disabled="isCancelling" class="mt-3" color="error" code="M0">
								<v-icon class="mr-1">mdi-stop</v-icon>
								{{ cancelText }}
							</code-btn>

							<code-btn v-if="!isPrinting && processAnotherCode" block class="mt-3" color="success" :code="processAnotherCode">
								<v-icon class="mr-1">{{ processAnotherIcon }}</v-icon>
								{{ processAnotherText }}
							</code-btn>

							<v-menu v-if="thumbnails.some(thumbnail => thumbnail.data !== null)" open-on-click offset-y>
								<template #activator="{ attrs, on }">
									<v-btn color="info" block :disabled="uiFrozen" class="mt-3" v-bind="attrs" v-on="on">
										<v-icon class="mr-1">mdi-image</v-icon>
										{{ $t("panel.jobControl.showPreview" )}}
									</v-btn>
								</template>

								<v-card>
									<v-carousel height="auto" hide-delimiters :show-arrows="validThumbnails.length > 1"
												show-arrows-on-hover>
										<v-carousel-item v-for="thumbnail in validThumbnails"
														:key="`${thumbnail.format}-${thumbnail.width}x${thumbnail.height}`">
											<div class="d-flex fill-height align-center">
												<thumbnail-img :thumbnail="thumbnail" class="mx-auto" />
											</div>
										</v-carousel-item>
									</v-carousel>
								</v-card>
							</v-menu>
						</div>

						<!-- Estimated times -->
						<v-row class="pt-6">
							<v-col md="4" lg="3" xl="3" class="py-1">
								<strong>
									Estimated Finish
								</strong>
							</v-col>
							<v-col class="py-1">
								<span>
									{{ $displayTime(timesLeft.file) }}
								</span>
							</v-col>
						</v-row>
						<v-row>
							<v-col md="4" lg="3" xl="3" class="py-1">
								<strong>
									Job Time
								</strong>
							</v-col>
							<v-col class="py-1">
								<span>
									{{ $displayTime(jobDuration) }}
								</span>
							</v-col>
						</v-row>
						<v-row v-if="simulationTime !== null" class="">
							<v-col md="4" lg="3" xl="3" class="py-1">
								<strong>
									{{ $t("panel.jobEstimations.simulation") }}
								</strong>
							</v-col>
							<v-col class="py-1">
								<span>
									{{ $displayTime(simulationTime) }}
								</span>
							</v-col>
						</v-row>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<v-row :dense="$vuetify.breakpoint.mobile">
			<v-col>
				<v-card>
					<event-list></event-list>
				</v-card>
			</v-col>
		</v-row>
	</div>
</template>

<script>
'use strict';
import { MachineMode, MachineStatus, ThumbnailInfo } from "@duet3d/objectmodel";

import store from "@/store";
import Vue from "vue";

import { isPaused, isPrinting } from "@/utils/enums";
import { escapeFilename } from "@/utils/path";

export default Vue.extend({
	computed: {
		isConnected() {
			return store.getters["isConnected"];
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
		uiFrozen() { return store.getters["uiFrozen"]; },
		isPausing() { return store.state.machine.model.state.status === MachineStatus.pausing; },
		isPaused() { return isPaused(store.state.machine.model.state.status); },
		isCancelling() { return store.state.machine.model.state.status === MachineStatus.cancelling; },
		isPrinting() { return isPrinting(store.state.machine.model.state.status); },
		pauseResumeText() {
			if (this.isSimulating) {
				return this.$t(this.isPaused ? "panel.jobControl.resumeSimulation" : "panel.jobControl.pauseSimulation");
			}
			if (store.state.machine.model.state.machineMode === MachineMode.fff) {
				return this.$t(this.isPaused ? "panel.jobControl.resumePrint" : "panel.jobControl.pausePrint");
			}
			return this.$t(this.isPaused ? "panel.jobControl.resumeJob" : "panel.jobControl.pauseJob");
		},
		cancelText() {
			if (this.isSimulating) {
				return this.$t("panel.jobControl.cancelSimulation");
			}
			if (store.state.machine.model.state.machineMode === MachineMode.fff) {
				return this.$t("panel.jobControl.cancelPrint");
			}
			return this.$t("panel.jobControl.cancelJob");
		},
		processAnotherCode() {
			if (store.state.machine.model.job.lastFileName !== null) {
				if (store.state.machine.model.job.lastFileSimulated && (store.state.machine.model.job.lastFileAborted || store.state.machine.model.job.lastFileCancelled)) {
					return `M37 P"${escapeFilename(store.state.machine.model.job.lastFileName)}"`;
				}
				return `M32 "${escapeFilename(store.state.machine.model.job.lastFileName)}"`;
			}
			return "";
		},
		processAnotherIcon() {
			if (store.state.machine.model.job.lastFileSimulated && !(store.state.machine.model.job.lastFileAborted || store.state.machine.model.job.lastFileCancelled)) {
				return (!store.state.machine.model.state.machineMode || store.state.machine.model.state.machineMode === MachineMode.fff) ? "mdi-printer" : "mdi-play";
			}
			return "mdi-restart";
		},
		processAnotherText() {
			if (store.state.machine.model.job.lastFileSimulated) {
				if (store.state.machine.model.job.lastFileAborted || store.state.machine.model.job.lastFileCancelled) {
					return this.$t('panel.jobControl.repeatSimulation');
				}
				return (!store.state.machine.model.state.machineMode || store.state.machine.model.state.machineMode === MachineMode.fff) ? this.$t('panel.jobControl.printNow') : this.$t("panel.jobControl.startJob");
			}
			if (store.state.machine.model.state.machineMode === MachineMode.fff) {
				return this.$t('panel.jobControl.repeatPrint');
			}
			return this.$t('panel.jobControl.repeatJob');
		},
		thumbnails() {
			const thumbnails = (store.state.machine.model.job.file !== null) ? store.state.machine.model.job.file.thumbnails.slice() : [];
			thumbnails.sort((a, b) => (b.width * b.height) - (a.width * a.height));		// return biggest thumbnails first
			return thumbnails;
		},
		validThumbnails() {
			return this.thumbnails.filter(thumbnail => !!thumbnail.data);
		},
		timesLeft() { return store.state.machine.model.job.timesLeft; },
		simulationTime() {
			if (!this.isSimulating && store.state.machine.model.job.file !== null && store.state.machine.model.job.file.simulatedTime !== null && store.state.machine.model.job.duration != null) {
				return this.isPrinting ? Math.max(0, (store.state.machine.model.job.file.simulatedTime) - store.state.machine.model.job.duration) : store.state.machine.model.job.file.simulatedTime;
			}
			return null;
		},
		jobDuration() {
			return isPrinting(store.state.machine.model.state.status) ? store.state.machine.model.job.duration : store.state.machine.model.job.lastDuration;
		}
	},
	data() {
		return {
			shouldRunCleanPurge: false,
			isSimulating: false,
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
		async sendCode(code) {
			await store.dispatch("machine/sendCode", code);
		},
	},
	mounted() {
		this.shouldRunCleanPurge = this.global.get("cleanPurge");
		this.isSimulating = (store.state.machine.model.state.status === MachineStatus.simulating);
	},
	watch: {
		isPrinting(to) {
			if (to) {
				this.isSimulating = (store.state.machine.model.state.status === MachineStatus.simulating);
			} else {
				this.isSimulating = false;
			}
		}
	}
});
</script>

<style>
</style>
