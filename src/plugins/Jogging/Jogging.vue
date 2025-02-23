<template>
	<div>
		<v-row id="homedCard">
			<v-col v-if="(!this.axes[0]?.homed) || (!this.axes[1]?.homed) || (!this.axes[2]?.homed)">
				<v-card id="homed" :disabled="status!='idle'" color="#D84315" class="mx-6">
					<v-card-title class="justify-center">
						Machine not homed!
						<v-btn class="rlp-home" @click='homing("all")'>
							HOME
						</v-btn>
					</v-card-title>
				</v-card>
			</v-col>
		</v-row>
		<v-row class="justify-center">
			<v-col>
				<v-card id="keypad" :disabled="status!='idle' || idlePurging">
					<v-card-title >
						<v-icon class="mr-2">
							{{ arrowIcon }}
						</v-icon>
						Jog
					</v-card-title>
					<div class="mx-6">
						<v-row>
							<v-col>
								<div>
									<v-btn class="rlp-basic" @click="setupLoc" :disabled='global.get("purge_loc")' block>
										PURGE LOCATION
									</v-btn>
								</div>
							</v-col>
							<v-col>
								<div>
									<v-btn class="rlp-basic" @click="goOrigin" block>
										ORIGIN
									</v-btn>
								</div>
							</v-col>
						</v-row>
						<v-row>
							<v-col>
								<div v-if="mode!=7">
									<v-btn  class="rlp-utility" @click="lock" block>
										UNLOCK MACHINE
									</v-btn>
								</div>
								<div v-if="mode==7">
									<v-btn class="rlp-on" @click="lock" block>
										LOCK MACHINE
									</v-btn>
								</div>
							</v-col>
						</v-row>
						<br>
						<v-col>
							<v-row>
								<v-text-field type="number" id="xx" label="X:" :placeholder=String(axes[0].machinePosition) persistent-placeholder v-model="xInp"></v-text-field>
							</v-row>
							<v-row>
								<v-text-field type="number" id="yy" label="Y:" :placeholder=String(axes[1].machinePosition) persistent-placeholder v-model="yInp"></v-text-field>
							</v-row>
							<v-row>
								<v-btn class="rlp-basic" @click="goTo">
									GO
								</v-btn>
							</v-row>
							<br>
							<v-row>
								<v-text-field type="number" id="zz" label="Z:" :placeholder=String(axes[2].machinePosition) persistent-placeholder v-model="zInp"></v-text-field>
							</v-row>
							<v-row>
								<v-btn class="rlp-basic" @click="zGoTo">
									GO
								</v-btn>
							</v-row>
							<br>
						</v-col>
					</div>
					<div class="mx-3">
						<v-col>
							<v-btn v-if="(!this.axes[0]?.homed) || (!this.axes[1]?.homed) || (!this.axes[2]?.homed)" class="rlp-home" @click="homing('all')" block>
								HOME AXES
							</v-btn>
							<v-btn v-else class="rlp-utility" @click="homing('all')" block>
								HOME AXES
							</v-btn>
						</v-col>
					</div>
					<br>
					<v-expansion-panels>
						<v-expansion-panel>
							<v-expansion-panel-header>Last Job Start Location</v-expansion-panel-header>
							<v-expansion-panel-content class="font-family: IBM Plex Mono">
								X: {{ $display(global.get("placeX")) }}<br>
								Y: {{ $display(global.get("placeY")) }}<br>
								Z: {{ $display(global.get("placeZ")) }}
							</v-expansion-panel-content>
						</v-expansion-panel>
					</v-expansion-panels>
				</v-card>
			</v-col>
		</v-row>
	</div>
</template>

<script>
'use strict';

import store from "@/store";
import Vue from "vue";
//import ObjectModel, { Axis, Board, MachineMode, Probe, ProbeType } from "@duet3d/objectmodel";
import {mapState, mapGetters, mapActions} from 'vuex';
import { mapMutations } from 'vuex';

export default Vue.extend ({
	computed: {
		isConnected() {
			return store.getters["isConnected"];
		},
		uiFrozen() {
			return store.getters["uiFrozen"];
		},
		model() {
			return store.state.machine.model;
		},
		move() {
			return store.state.machine.model.move;
		},
		axes() {
			return store.state.machine.model.move.axes;
		},
		global() {
			return store.state.machine.model.global;
		},
		extruders() {
			return this.global.get("extruder_num");
		},
		status() {
			return store.state.machine.model.state.status;
		},
		light() {
			return store.state.machine.model.fans[2]?.actualValue;
		},
		mode() {
			return this.global.get("mode");
		},
		...mapState(['selectedMachine']),
		//...mapGetters(['isConnected', 'uiFrozen']),
		...mapState('machine/cache', {
			pluginCache: (state) => state.plugins.Jogging,
		}),/*
		...mapState('machine/model', {
			systemDirectory: (state) => state.directories.system,
			move: (state) => state.move,
			axes: (state) => state.move.axes,
			extruders: (state) => state.global.extruder_num,
			global: (state) => state.global,
			status: (state) => state.state.status,
			air: (state) => state.fans[0].actualValue,
			light: (state) => state.fans[4].actualValue,
			kinematicsName: (state) => state.move.kinematics.name,
		}),*/
		...mapState('settings', ['language']),
	},
	data() {
		return {
			files: [],
			selectedFile: null,

			isActive: false,
			ready: false,
			loading: false,
			errorMessage: null,

			// RLP data
			running: "not running",
			codeIdle: true,
			codeReply: null,
			idlePurging: false,
			started: false,
			canvas: null,
			rendering: null,
			ctx: null,
			pos: null,
			xPos: null,
			yPos: null,
			tempX: null,
			tempY: null,
			xInp: undefined,
			yInp: undefined,
			zInp: undefined,
			container: null,
			currX: null,
			currY: null,
			homed: false,
			clickerEnabled: false,
			arrowIcon: 'mdi-arrow-all',
			mouseIcon: 'mdi-mouse-move-vertical',
			purgeIcon: 'mdi-water-outline',
			locationIcon: 'mdi-map-marker',
			resizeNum: null,
			time: null,
			interval: null,
			refreshBed: true,
		};
	},
	methods: {
		...mapActions('machine', ['download', 'getFileList', 'sendCode', 'warn']),// 'model']),
		...mapMutations(['hideCodeReplyNotifications', 'showCodeReplyNotifications']),
		log() {
			console.log(process.env.BASE_URL);
		},
		resize() {
			if (!this.isActive) {
				return;
			}

			// Resize canvas elements
			const width = document.body.clientWidth / 3
			let height;
			switch (this.$vuetify.breakpoint.name) {
				case 'xs':
					height = (width * 103) / 111;
					break;
				case 'sm':
					height = (width * 103) / 111;
					break;
				case 'xl':
					height = (width * 103) / 111;
					break;
				default:
					height = (width * 103) / 111;
					break;
			}/*
			this.resizeNum = [width, height];
			this.canvas = document.getElementById("canvas");
			if (this.canvas) {
				this.canvas.width = width;
				this.canvas.height = height;

				this.ctx = this.canvas.getContext('2d');
				this.renderBed();
			}*/
			return { width, height };
		},
		async lock() {
			// don't allow locking/unlocking if in the wrong mode!!! add in actual function here
			if (this.mode != 7) {
				await this.sendCode("set global.mode=7");
			}
			else {
				await this.sendCode("set global.mode=2");
			}
		},
		async homing(axis) {
			if ((this.global.get("mode") == 2) || (this.global.get("mode") == 0)) {
				if (axis == "all") {
					this.codeReply = this.sendCode('M98 P"homeall.g"');
					setTimeout(() => {
						var homed = document.getElementById("homedCard");
						if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
							return;
						}
						homed.style.display = "none";
					}, 400);
				}
				else if (axis == "x") {
					await this.sendCode('M98 p"homez.g"');
					this.codeReply = this.sendCode('M98 P"homex.g"');
					setTimeout(() => {
						var homed = document.getElementById("homedCard");
						if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
							return;
						}
						homed.style.display = "none";
					}, 400);
				}
				else if (axis == "y") {
					await this.sendCode('M98 p"homez.g"');
					this.codeReply = this.sendCode('M98 P"homey.g"');
					setTimeout(() => {
						var homed = document.getElementById("homedCard");
						if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
							return;
						}
						homed.style.display = "none";
					}, 400);
				}
				else if (axis == "z") {
					this.codeReply = this.sendCode('M98 P"homez.g"');
					setTimeout(() => {
						var homed = document.getElementById("homedCard");
						if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
							return;
						}
						homed.style.display = "none";
					}, 400);
				}
			}
			else {
				this.sendCode('echo "Unable to home. If in purge mode, try returning to origin, or restarting the machine."');
			}
		},
		async goTo() {
			if (this.xInp || this.yInp) {
				if (this.global.get("mode") == 2) {
					if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
						this.sendCode('echo "One or more axes are not homed! Please home axes before moving."');
						var x = document.getElementById("xx");
						var y = document.getElementById("yy");
						x.value = undefined;
						y.value = undefined;
						this.xInp = undefined;
						this.yInp = undefined;
						return;
					}
					if ((this.xInp != undefined && (this.xInp > this.axes[0].max || this.xInp < this.axes[0].min)) || (this.yInp != undefined && (this.yInp > this.axes[1].max || this.yInp < this.axes[1].min))) {
						this.sendCode('echo "Travel beyond machine limits!!!"');
						x = document.getElementById("xx");
						y = document.getElementById("yy");
						x.value = undefined;
						y.value = undefined;
						this.xInp = undefined;
						this.yInp = undefined;
						return;
					}
					if (this.axes[2].machinePosition < 0) {
						//await this.sendCode("M42 P4 S0");
						await this.sendCode("G1 Z0 F4000");
					}
					if (this.xInp != this.axes[0].machinePosition && this.yInp != this.axes[1].machinePosition) {
						if (this.yInp == undefined) {
							//await this.sendCode("M42 P4 S0");
							await this.sendCode("G1 X"+this.xInp+"F6000");
						}
						else if (this.xInp == undefined) {
							//await this.sendCode("M42 P4 S0");
							await this.sendCode("G1 Y"+this.yInp+"F6000");
						}
						else {
							//await this.sendCode("M42 P4 S0");
							await this.sendCode("G1 X"+this.xInp+" Y"+this.yInp+"F6000");
						}
					}
					else if ((this.xInp != this.axes[0].machinePosition) && (this.xInp != undefined)) {
						//await this.sendCode("M42 P4 S0");
						await this.sendCode("G1 X"+this.xInp+"F6000");
					}
					else if ((this.yInp != this.axes[1].machinePosition) && (this.yInp != undefined)) {
						//await this.sendCode("M42 P4 S0");
						await this.sendCode("G1 Y"+this.yInp+"F6000");
					}
					await this.sendCode("M400");
					//await this.sendCode("M42 P4 S1");
				}
				else {
					this.sendCode('echo "Unable to go to location. Please exit purging mode, home, or restart the machine."');
				}
			}/*
			setTimeout(() => {
				this.renderBed();
				x = document.getElementById("xx");
				y = document.getElementById("yy");
				x.value = undefined;
				y.value = undefined;
				this.xInp = undefined;
				this.yInp = undefined;
			}, 1500);*/
		},
		async zGoTo() {
			if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
				this.sendCode('echo "One or more axes are not homed! Please home axes before moving."');
				var z = document.getElementById("zz");
				z.value = undefined;
				this.zInp = undefined;
				return;
			}
			if (this.global.get("mode") == 2) {
				if (this.zInp > this.axes[2].max || this.zInp < this.axes[2].min) {
					this.sendCode('echo "Travel beyond machine limits!!!')
					z = document.getElementById("zz");
					z.value = undefined;
					this.zInp = undefined;
					return;
				}
				//await this.sendCode("M42 P4 S0");
				await this.sendCode("G1 Z"+this.zInp);
				z = document.getElementById("zz");
				z.value = undefined;
				this.zInp = undefined;
				await this.sendCode("M400");
				//await this.sendCode("M42 P4 S1");
			}
			else {
				this.sendCode('echo "Unable to go to location. Please exit purging mode, home, or restart the machine."');
			}
		},
		async setupLoc() {
			if (this.global.get("mode") == 2) {
				await this.sendCode('M98 p"/macros/go_purge.g"');
			}
			else if (this.global.get("purge_loc") == true) {
				this.sendCode('echo "You are already in purge location."');
			}
			else {
				this.sendCode('echo "Unable to go to purge location. Please home or restart the machine."');
			}
			/*
			if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
				this.sendCode('echo "One or more axes are not homed! Please home axes before moving."');
				return;
			}
			if (this.axes[0].machinePosition != this.global["purgeX"] || this.axes[1].machinePosition != this.global["purgeY"]) {
				await this.sendCode("M42 P4 S0");
				await this.sendCode("G1 Z0 F4000");
				await this.sendCode("G1 X{global.purgeX} Y{global.purgeY} F6000");
				await this.sendCode("G1 Z{global.purgeZ} F4000");
			}
			else if (this.axes[2].machinePosition != this.global["purgeZ"]) {
				await this.sendCode("M42 P4 S0");
				await this.sendCode("G1 Z{global.purgeZ} F4000");
			}
			await this.sendCode("M400");
			await this.sendCode("M42 P4 S1");*/
		},
		async goOrigin() {
			if (this.global.get("mode") == 5) {
				await this.sendCode('M98 P"/macros/go_origin.g"');
			}
			else if (this.global.get("purge_loc") != true) {
				this.sendCode('echo "Not currently in purge location."');
			}
			else {
				this.sendCode('echo "Unable to go to origin. Please home or restart the machine."');
			}
		},
		async sendTheCode(codetosend, amount, axis) {
			if (!this.axes[axis].homed) {
				this.sendCode('echo "Axis not homed! Please home axis before moving."');
				return;
			}
			if (this.global.get("mode") == 2) {
				if (this.axes[axis].machinePosition+amount>this.axes[axis].max || this.axes[axis].machinePosition+amount<this.axes[axis].min) {
					this.sendCode('echo "Too far!!!"');
					return;
				}
				while (this.started == true && this.codeIdle == true) {
					try {
						this.codeIdle = false;
						//await this.sendCode("M42 P4 S0");
						this.codeReply = await this.sendCode(codetosend+String(this.axes[axis].machinePosition+amount));
						await this.sendCode("M400");
						//await this.sendCode("M42 P4 S1");
						setTimeout(() => {
							//this.renderBed();
							this.codeIdle = true;
						}, 400);
					}
					catch(e) {
						console.warn(e);
					}
				}
			}
			else {
				this.sendCode('echo "Unable to jog. Please exit purge mode, home, or restart the machine."');
			}
		},
		async refresh() {
			if (!this.isConnected) {
				this.ready = false;
				this.errorMessage = null;
				this.selectedFile = null;
				this.files = [];
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
		this.resize();
		//this.hideCodeReplyNotifications();
	},
	deactivate() {
		this.isActive = false;
		this.showCodeReplyNotifications();
	},
	/*created() {

	},*/
	async mounted() {
		if (this.isConnected) {
			this.refresh();
		}
		await this.resize();
		this.showCodeReplyNotifications();
		
		this.ready = true;
	},
	watch: {	},
});

</script>

<style scoped>
.v-card {
	background-color: #272b2f;
}
.v-btn {
	height: 60px !important;
	font-size: 36px;
	font-family: 'IBM Plex Mono', monospace !important;
	background-color: #2d3236 !important;
	border: 5px solid;
	border-color: #4518c0 !important;
}
.v-btn.rlp-basic {
	background-color: #4487be !important;
	border: 0px solid;
	border-color: #4518c0 !important;
	border-radius: 40px !important;
}
.v-btn.rlp-utility {
	background-color: #105a96 !important;
	border: 0px solid;
	border-color: #4518c0 !important;
	border-radius: 40px !important;
}
.v-btn.rlp-on {
	background-color: #862d11 !important;
	border: 0px;
}
.v-btn.rlp-home {
	background-color: #862d11 !important;
	margin-left: 20px;
	border: 0px;
}
.v-card__title {
	font-size: 25px !important;
}
.v-expansion-panel {
	font-size: 25px !important;
	font-family: "IBM Plex Mono", monospace;
}
.v-expansion-panel-header {
	font-size: 25px !important;
	font-family: "Work Sans", sans-serif !important;
}
</style scoped>