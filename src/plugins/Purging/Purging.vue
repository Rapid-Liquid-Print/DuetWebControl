<template>
	<div>
		<v-row id="homedCard">
			<v-col v-if="(!this.axes[0]?.homed) || (!this.axes[1]?.homed) || (!this.axes[2]?.homed)">
				<v-card id="homed" :disabled="status!='idle'" color="warning" class="mx-6">
					<v-card-title class="justify-center">
						Machine not homed!
						<v-btn class="ma-2" @click='homing("all")' color="blue">
							Home
						</v-btn>
					</v-card-title>
				</v-card>
			</v-col>
		</v-row>
		
		<v-row class="justify-center">
			<v-col>
				<v-card id="purging" :disabled="status!='idle'" class="justify-left my-1">
					<v-card-title>
						<v-icon class="mr-2">
							{{ purgeIcon }}
						</v-icon>
						Purge
					</v-card-title>
					<v-expansion-panels v-model="panel">
						<v-expansion-panel>
							<v-expansion-panel-header>Basic</v-expansion-panel-header>
							<v-expansion-panel-content>
								<div>
									<v-btn color="green" @click="refreshPurge(true)" block>
										1:1 Purge
									</v-btn>
								</div>
								<br>
								<div>
									<v-btn color="green darken-4" @click='cleanPurging' block>
										Clean Purge
									</v-btn>
								</div>
								<br>
								<div v-if="!idlePurging">
									<v-btn color="green darken-4" @click='sneezePurge("AB")' block>
										Sneeze
									</v-btn>
								</div>
								<br>
								<div v-if="air==0">
									<v-btn color="#00838F" @click="airPressure" block>
										Air On
									</v-btn>
								</div>
								<div v-if="air==1">
									<v-btn color="red darken-3" @click="airPressure" block>
										Air Off
									</v-btn>
								</div>
								<br>
							</v-expansion-panel-content>
						</v-expansion-panel>
						<v-expansion-panel>
							<v-expansion-panel-header>Advanced</v-expansion-panel-header>
							<v-expansion-panel-content>
								<v-row>
									<v-col>
										<div v-if="extruders.length>2">
											Additive %
											<br>
											<br>
											<v-row v-for="extruder in extruders" :key="extruder" class="mx-4">
												<div v-if="(extruder != 'A') && (extruder != 'B')">
													<v-row>
														<v-checkbox :label="extruder" v-model='adds[extruder][0]' @change="refreshAddText(extruder)"/>
													</v-row>
													<v-row v-if="adds[extruder][0]">
															<v-text-field type="number" v-model="adds[extruder][2]" :id="adds[extruder].key" :placeholder="String(adds[extruder][1])" persistent-placeholder clearable @click:clear="refreshAddText(extruder)" @change="refreshAddText(extruder)" @blur="refreshAddText(extruder)"></v-text-field>
													</v-row>
												</div>
											</v-row>
										</div>
										<br>
										Custom Ratio
										<br>
										<br>
										<div>
											<v-row class="text-center mx-2">
												<v-text-field type="number" id="ratInp1" value=1 label="A:" v-model="aInp" clearable @clear="refreshRatio" @change="refreshRatio" @blur="refreshRatio"></v-text-field>
											</v-row>
											<v-row class="text-center mx-2">
												<v-text-field type="number" id="ratInp2" value=1 label="B:" v-model="bInp" clearable @clear="refreshRatio" @change="refreshRatio" @blur="refreshRatio"></v-text-field>
											</v-row>
										</div>
										<br>
									</v-col>
									<v-col>
										<div v-if="needle && ratio">
											Ratio Set At {{ ratioString }}
											<br>
											<br>
											<div v-if="!idlePurging">
												<!--v-btn color="green" @click="fullPurge" block>
													Purge
												</v-btn>
												<br-->
												<v-btn color="green" @click="refreshPurge(false)" block>
													Purge
												</v-btn>
												<br>
												<!--v-btn color="teal" @click="printString" block>
													Print Extrusion String
												</v-btn-->
											</div>
										</div>
										Idle Mode - Purge Every:
										<br>
										<br>
										<v-row>
											<v-col>
												<v-btn-toggle v-model="time">
													<v-btn value=5 color='gray'>
														5min
													</v-btn>
													<v-btn value=10 color='gray'>
														10min
													</v-btn>
													<v-btn value=15 color='gray'>
														15min
													</v-btn>
												</v-btn-toggle>
											</v-col>
										</v-row>
										<br>
										<div v-if="needle && ratio && time">
											<div v-if="!idlePurging">
												<v-btn color="green" @click="idleMode" block>
													Idle Purge
												</v-btn>
												<br>
											</div>
											<div v-if="idlePurging">
												<v-btn color="red" @click="stopIdleMode" block>
													End Idle Purge
												</v-btn>
												<br>
											</div>
										</div>
									</v-col>
								</v-row>
							</v-expansion-panel-content>
						</v-expansion-panel>
					</v-expansion-panels>
					<br>
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
			var extruders = [];
			const extrsObj = this.global.get("extrs");
			for (var i = 0; i < extrsObj.length; i++) {
				extruders.push(extrsObj[i]);
			}
			return extruders;
			//return this.global.get("extruder_num");
		},
		status() {
			return store.state.machine.model.state.status;
		},
		statusthing() {
			return store.state.machine.model.state.status;
		},
		air() {
			return store.state.machine.model.fans[0]?.actualValue;
		},
		...mapState(['selectedMachine']),
		//...mapGetters(['isConnected', 'uiFrozen']),
		...mapState('machine/cache', {
			pluginCache: (state) => state.plugins.Purging,
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
			needle: 0.5,
			ratio: 1,
			ratios: {"A1": [false,1,0.5],"B1":[false,1,0.5],"A2":[false,0,0],"B2":[false,0,0],"C":[false,0,0],"D":[false,0,0],"E":[false,0,0],"F":[false,0,0],"G":[false,0,0],"H":[false,0,0],"I":[false,0,0],"J":[false,0,0],"K":[false,0,0],"L":[false,0,0],"M":[false,0,0],"N":[false,0,0],"O":[false,0,0],"P":[false,0,0],"Q":[false,0,0],"R":[false,0,0],"S":[false,0,0],"T":[false,0,0],"U":[false,0,0],"V":[false,0,0],"W":[false,0,0]},
			adds: {"A2":[false,0,"0"],"B2":[false,0,"0"],"C":[false,0,"0"],"D":[false,0,"0"],"E":[false,0,"0"],"F":[false,0,"0"],"G":[false,0,"0"],"H":[false,0,"0"],"I":[false,0,"0"],"J":[false,0,"0"],"K":[false,0,"0"],"L":[false,0,"0"],"M":[false,0,"0"],"N":[false,0,"0"],"O":[false,0,"0"],"P":[false,0,"0"],"Q":[false,0,"0"],"R":[false,0,"0"],"S":[false,0,"0"],"T":[false,0,"0"],"U":[false,0,"0"],"V":[false,0,"0"],"W":[false,0,"0"]},
			totAdditive: 0,
			ratioString: "1:1",
			idlePurging: false,
			running: "not running",
			codeIdle: true,
			codeReply: null,
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
			aInp: undefined,
			bInp: undefined,
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
			panel: 0,
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
		refreshRatio() {
			/*var tempRatioInput;
			var tempRatio;
			for (var i = 0; i < move.extruders.length; i++) {
				tempRatioInput = document.getElementById(this.ratios[i][0]+"custom");
				tempRatio = parseFloat(tempRatioInput.value);
				this.ratios[i][2] = tempRatio;
			}
			var ratioTotal = 0;
			for (var i = 0; i < move.extruders.length; i++) {
				ratioTotal += this.ratios[i][2];
			}
			for (var i = 0; i < move.extruders.length; i++) {
				this.ratios[i][3] = this.ratios[i][2] / ratioTotal;
			}
			*/
			var btn1 = document.getElementById("ratBtn1");
			var btn2 = document.getElementById("ratBtn2");
			var inp1 = document.getElementById("ratInp1");
			var inp2 = document.getElementById("ratInp2");
			this.aInp = parseFloat(inp1.value);
			this.bInp = parseFloat(inp2.value);
			if (((this.aInp != 1) && (String(this.aInp) != String(Number.NaN))) && ((this.bInp == 1) || (String(this.bInp) == String(Number.NaN)))) {
				this.ratio = this.aInp;
				//btn1.disabled = true;
				//btn2.disabled = true;
			}
			else if (((this.aInp != 1) && (String(this.aInp) != String(Number.NaN))) && ((this.bInp != 1) &&  (String(this.bInp) != String(Number.NaN)))) {
				this.ratio = (this.aInp / this.bInp);
				//btn1.disabled = true;
				//btn2.disabled = true;
			}
			else if (((this.aInp == 1) || (String(this.aInp) == String(Number.NaN))) && ((this.bInp != 1) && (String(this.bInp) != String(Number.NaN)))) {
				this.ratio = (1 / this.bInp);
				//btn1.disabled = true;
				//btn2.disabled = true;
			}
			else if ((this.aInp == 1) && (this.bInp == 1)) {
				this.ratio = 1;
			}
			else {
				this.ratio = undefined;
				//btn1.disabled = false;
				//btn2.disabled = false;
			}
			this.makeRatioString();
		},
		refreshAdd(state, extruder) {
			if(!state) {
				//this.adds[add][0] = false;
				this.totAdditive = this.totAdditive - parseFloat(this.adds[extruder][1]);
				this.adds[extruder][1] = 0;
			}
		},
		refreshAddText(extruder) {
			if ((this.adds[extruder][2] == "0") || (this.adds[extruder][2] == undefined) || (this.adds[extruder][2] == "") || !(this.adds[extruder][0])) {
				this.totAdditive = this.totAdditive - this.adds[extruder][1];
				this.adds[extruder][1] = 0;
				this.adds[extruder][2] = "0";
				this.makeRatioString();
				return;
			}
			var newAdd = parseFloat(this.adds[extruder][2]) / 100;
			if (this.adds[extruder][1] != 0) {
				this.totAdditive = this.totAdditive - this.adds[extruder][1] + newAdd;
				this.adds[extruder][1] = newAdd;
				this.makeRatioString();
				return;
			}
			this.totAdditive = this.totAdditive + newAdd;
			this.adds[extruder][1] = newAdd;
			this.makeRatioString();
		},
		makeRatioString() {		// THIS WILL NOT WORK FOR B2+ ADDITIVES THAT WON'T BE GOING INTO B
			if (this.ratio != undefined) {
				var a1perc = 1 - this.adds["A2"][1];
				var a2perc = this.adds["A2"][1];
				var a1 = Number(this.ratio) * a1perc;
				var a2 = Number(this.ratio) * a2perc;
				var b1perc = 1 - this.adds["B2"][1];
				var b2perc = this.adds["B2"][1];
				var b1 = 1 * b1perc;
				var b2 = 1 * b2perc;
				if ((((a2 == 0) && !(this.extruders.includes("A2"))) && ((b2 == 0) && !(this.extruders.includes("B2"))))) {
					this.ratioString = String(a1.toFixed(3)) + ":" + String(b1.toFixed(3)); 
				}
				else if ((a2 == 0) && !(this.extruders.includes("A2"))) {
					this.ratioString = String(a1.toFixed(3)) + ":" + String(b1.toFixed(3)) + ":" + String(b2.toFixed(3));
				}
				else if ((b2 == 0) && !(this.extruders.includes("B2"))) {
					this.ratioString = String(a1.toFixed(3)) + ":" + String(b1.toFixed(3)) + ":" + String(a2.toFixed(3))
				}
				else {
					this.ratioString = String(a1.toFixed(3)) + ":" + String(b1.toFixed(3)) + ":" + String(a2.toFixed(3)) + ":" + String(b2.toFixed(3));
				}
			}/*
			var ratioArray = this.ratioString.split(":");
			this.ratioString = ratioArray[0] + ":";
			for (var i = 1; i < this.extruders.length - 1; i++) {
				this.ratioString += ratioArray[i] + ":";
			}
			this.ratioString += ratioArray[this.extruders.length - 1];*/
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
		async idleMode() {
			if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
				this.sendCode('echo "One or more axes are not homed! Please home axes before moving."');
				return;
			}
			if ((this.global.get("mode") == 2) || (this.global.get("mode") == 5)) {
				this.idlePurging = true;
				await this.sendCode('M98 P"/macros/go_purge.g"');
				await this.sendCode('M400');
				this.interval = setInterval(this.purge, this.time*60000);
			}
			else {
				this.sendCode('echo "Unable to enter idle mode. Please home or restart the machine."');
			}
		},
		async stopIdleMode() {
			clearInterval(this.interval);
			this.idlePurging = false;
		},
		async refreshPurge(one) {
			if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
				this.sendCode('echo "One or more axes are not homed! Please home axes before moving."');
				return;
			}
			if ((this.global.get("mode") == 2) || (this.global.get("mode") == 5)) {
				await this.sendCode('M98 P"/macros/go_purge.g"');
				await this.sendCode('M400');
				await this.purge(one);
			}
			else {
				this.sendCode('echo "Unable to perform refresh purge. Please home or restart the machine."');
			}
		},
		makeExtrusionString(extFactor, one) {
			var ratios = [0,0,0,0];
			var tempRat = 1;
			if (!one) {
				tempRat = parseFloat(this.ratio);
			}
			/*if (this.adds[1][1]) {
				var exA = tempRat / (tempRat + (this.totAdditive * (1 + tempRat)) + 1);
				var exB = 1 / (tempRat + (this.totAdditive * (1 + tempRat)) + 1);
				ratios[0] = exA;
				ratios[1] = exB;
				ratios.push(this.adds[0][2]/(this.totAdditive + 1));
				ratios.push(this.adds[1][2]/(this.totAdditive + 1));
			}*/
			/*exA = tempRat / (tempRat + (this.totAdditive * (1 + tempRat)) + 1);
			exB = 1 / (tempRat + (this.totAdditive * (1 + tempRat)) + 1);
			ratios[0] = exA;
			ratios[1] = exB;
			ratios.push(this.adds[0][2]/(this.totAdditive + 1));*/
			var exA = tempRat / (tempRat + 1);
			if (this.adds["A2"][0]) {
				var exC = exA * this.adds["A2"][1]
			}
			else {
				exC = 0;
			}
			var exB = (1 - exA);
			if (this.adds["B2"][0]) {
				var exD = exB * this.adds["B2"][1];
			}
			else {
				exD = 0;
			}
			ratios[0] = exA;
			ratios[1] = exB;
			ratios[2] = exC;
			ratios[3] = exD;
			var extString = "E" + String(ratios[0] * extFactor) + ":";
			for (let i=1; i<(ratios.length - 1); i++) {
				if (i > 1) {
					extString = extString + String(ratios[i] * extFactor) + ":";
				}
				else {
					extString = extString + String(ratios[i] * extFactor) + ":";
				}
			}
			if (ratios.length > 2) {
				extString = extString + (ratios[ratios.length - 1] * extFactor);
			}
			else {
				extString = extString + (ratios[ratios.length - 1] * extFactor);
			}
			return extString;
		},
		printString() {
			console.log(this.makeExtrusionString(300, false));
		},
		async fullPurge() {
			if ((!this.axes[0].homed) || (!this.axes[1].homed) || (!this.axes[2].homed)) {
				this.sendCode('echo "One or more axes are not homed! Please home axes before moving."');
				return;
			}
			if ((this.global.get("mode") == 2) || (this.global.get("mode") == 5)) {
				await this.sendCode('M98 P"/macros/go_purge.g"');
				await this.sendCode('M400');
				await this.sendCode('M98 P"/macros/cartridge_air_on.g"');
				await this.sendCode('G4 S2');
				await this.sendCode('T0');
				await this.sendCode('M83');
				var tempRat = parseFloat(this.ratio);
			/*if (this.needle == 0.25) {
				var aS = -1*(3 * (tempRat/(tempRat+1)));
				var bS = -1*(3 / (tempRat+1));
				if (tempRat != 1) {									// these will have to be changed at some point to account for C pump
					await this.sendCode("G1 E80:80");
				}
				await this.sendCode("G1 "+this.makeExtrusionString(350));
				await this.sendCode("G1 E"+String(aS)+":"+String(bS));
			}*/
			var aS = -1*(3 * (tempRat/(tempRat+1)));
			var bS = -1*(3 / (tempRat+1));
			if (tempRat != 1) {
				if (this.adds["A2"][0]) {			// change here if we add more additive pumps
					var a2perc = this.adds["A2"][1];
					var a2 = 80 * a2perc;
				}
				else {
					a2 = 0;
				}
				if (this.adds["B2"][0]) {
					var b2perc = this.adds["B2"][1]
					var b2 = 80 * b2perc;
				}
				else {
					b2 = 0;
				}
				var purgeRatio = "80:80:" + String(a2) + ":" + String(b2);
				await this.sendCode("G1 E" + purgeRatio);
				await this.purge(false);
			}
			else {
				await this.sendCode("G1 "+this.makeExtrusionString(350, false));
				await this.sendCode("G1 E"+String(aS)+":"+String(bS));
			}
			await this.sendCode("M400");
				//await this.sendCode("M42 P3 S0");
				await this.sendCode('M98 P"/macros/cartridge_air_off.g"');
				//await this.sendCode("M42 P4 S1");
			}
			else {
				this.sendCode('echo "Unable to perform purge. Please home or restart the machine."');
			}
		},
		async sneezePurge() {
			await this.sendCode('T0');
			await this.sendCode('M83');
			await this.sendCode('M400');
			await this.sendCode('M98 P"/macros/cartridge_air_on.g"');
			await this.sendCode('G4 S2');
			await this.sendCode("G1 E2:2");
			await this.sendCode("M400");
			await this.sendCode('M98 P"/macros/cartridge_air_off.g"');
		},
		async purge(one) {
			await this.sendCode('T0');
			await this.sendCode('M83');
			await this.sendCode('M98 P"/macros/cartridge_air_on.g"');
			await this.sendCode('G4 S2');
			var tempRat = 1;
			if (!one) {
				tempRat = parseFloat(this.ratio);
			}
			if (this.needle == 0.25) {
				var aS = -1*(3 * (tempRat/(tempRat+1)));
				var bS = -1*(3 / (tempRat+1));
				await this.sendCode("G1 "+this.makeExtrusionString(100, one));
				await this.sendCode("G1 E"+String(aS)+":"+String(bS));
			}
			else if (this.needle == 0.5) {
				aS = -1*(4.4 * (tempRat/(tempRat+1)));
				bS = -1*(4.4 / (tempRat+1));
				console.log(this.makeExtrusionString(200, one));
				await this.sendCode("G1 "+this.makeExtrusionString(200, one));
				await this.sendCode("G1 E"+String(aS)+":"+String(bS));
			}
			await this.sendCode("M400");
			await this.sendCode('M98 P"/macros/cartridge_air_off.g"');
		},
		async cleanPurging() {
			if ((this.global.get("mode") == 2) || (this.global.get("mode") == 5)) {
				await this.sendCode('M98 P"/macros/cleanpurge.g"');
			}
			else {
				this.sendCode('echo "Unable to perform clean purge. Please home or restart the machine"');
			}
		},
		async airPressure() {
			if (this.air == 0) {
				await this.sendCode('M98 P"/macros/cartridge_air_on.g"');
			}
			else {
				await this.sendCode('M98 P"/macros/cartridge_air_off.g"');
			}
		},
		async lightSwitch() {
			if (this.light == 0) {
				await this.sendCode('M98 P"/macros/light_on.g"');
			}
			else {
				await this.sendCode('M98 P"/macros/light_off.g"');
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
		//window.addEventListener("load", this.startRendering());
		this.ready = true;
	},
	watch: {	},
});

</script>
