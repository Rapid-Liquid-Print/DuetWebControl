<template>
	<div>
		<v-row id="homedCard">
			<v-col>
				<event-list />
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
		status() {
			return store.state.machine.model.state.status;
		},
		...mapState(['selectedMachine']),
		//...mapGetters(['isConnected', 'uiFrozen']),
		...mapState('machine/cache', {
			pluginCache: (state) => state.plugins.Info,
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
