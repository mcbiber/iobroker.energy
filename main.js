/* eslint-disable no-trailing-spaces */
"use strict";

/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const util = require("util");
const BiberFunctions = require("biber-functions");
const fs = require("fs");
const Energie = require("./energie.js");
const PSM = require("./psm.js");

class Energy extends utils.Adapter {

	/**
	 * class energie as interface with functions to consumption calculation
	 * @property {Energie} p_Energy 
	 */

	/**
	 * class energie as interface to use the functions for 
	 * calculation of summary of energy consumption
	 * @property {Energie} p_CountGesamtEnergy 
	 */

	/**
	 * class energie as interface to use the functions for 
	 * setting of energy states
	 * @property {Energie} p_SetEnergy 
	 */

	/**
	 * class energie as interface to use the functions for 
	 * calculation of current energy consumption
	 * @property {Energie} p_CountEnergy 
	 */

	/**
	 * class PSM as interface with functions to HMIP PSM handling
	 * @property {PSM} p_PSM 
	 */

	/**
	 * class BiberFunctions as interface with functions to node module biber-functions
	 * @property {BiberFunctions} p_BiberFunctions 
	 */

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "energy",
		});

		this.pathPrefix = "/opt/iobroker/iobroker-data/files/";
		// this.pathPrefix = "/home/rvolz/Development/iobroker/Files/VMTestBroker/";

		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));

		this.p_BiberFunctions = new BiberFunctions(this);

		this.p_Energy = new Energie(this);
		this.p_CountGesamtEnergy = new Energie(this);
		this.p_SetEnergy = new Energie(this);
		this.p_CountEnergy = new Energie(this);
		this.p_PSM = new PSM(this);
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// structure alias and data
		await this.createStructure();

		// reset home opions
		if (this.config.optionReplyBackup || this.config.optionUpdateSourceObjects
			|| this.config.optionCreateDataStructure || this.config.optionCreateAliasStructure) {
			if (this.config.optionReplyBackup) {
				await this.restore();
			}
			const obj = await this.getForeignObjectAsync("system.adapter.energy.0");
			if (obj && obj.common.enabled) {
				obj["native"]["optionReplyBackup"] = false;
				obj["native"]["optionUpdateSourceObjects"] = false;
				obj["native"]["optionCrateDataStructure"] = false;
				obj["native"]["optionInitializeDataStructure"] = false;
				this.setForeignObjectAsync("system.adapter.energy.0", obj);
			}
		}

		// check and set the adapter status
		this.AdapterIsUp();

		this.p_Energy.setKosten(this.config.optionEnergyCosts);
		this.p_Energy.setVerguetung(this.config.optionEnergySalary);

		this.process();
	}

	async process() {
		if (this.config.optionEnableEnergie) {
			this.log.info("Process energy consumption counting");
			this.p_CountEnergy.countEnergy();
			this.p_CountGesamtEnergy.countGesamt();
			this.p_SetEnergy.setDaily();
			this.p_SetEnergy.setMinutely();
			this.p_SetEnergy.setWeekly();
			this.p_SetEnergy.setMonthly();
			this.p_SetEnergy.setYearly();
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);
			this.log.info("Unload adapter");
			this.save();

			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			if (id == "Home.Alias.Photovoltaik.SMA_BEZUG" || id == "Home.Alias.Photovoltaik.SMA_NETZEINSPEISUNG") {
				if (id == "Home.Alias.Photovoltaik.SMA_BEZUG")
					this.p_Energy.setNetzbezug(state.val);

				if (id == "Home.Alias.Photovoltaik.SMA_NETZEINSPEISUNG") {
					this.p_Energy.calcMaxNetzEinspeisung(state);
				}
			}
			else if (id == "Home.Alias.Photovoltaik.SMA_ERTRAG_AKTUELL") {
				this.p_Energy.calcQuotes(state);
				this.p_Energy.calcMaxErtrag(state);
			}
			else
				this.p_BiberFunctions.update.updateTarget(id, state);

			// The state was changed
			// this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	/**
	 * creates structure when foreign needed adapter are ready
	 */
	async createStructure() {
		await this.setForeignObjectNotExistsAsync("energy.admin.ADAPTER_UP", { "type": "state", "common": { "name": "ADAPTER_UP", "type": "boolean", "role": "indicator", "read": true, "write": true, "def": false }, "native": {} });
		this.subscribeForeignStates("energy.admin.ADAPTER_UP");
		await this.setForeignObjectNotExistsAsync("energy.admin.FOREIGN_ADAPTER_RUNNING", { "type": "state", "common": { "name": "FOREIGN_ADAPTER_RUNNING", "type": "boolean", "role": "indicator", "read": true, "write": true, "def": false }, "native": {} });
		this.subscribeForeignStates("energy.admin.FOREIGN_ADAPTER_RUNNING");

		let historyIsUp = false; let smaIsUp = false; let modbusPVIsUp = false;
		let hmipIsUp = false;
		let obj = await this.getForeignObjectAsync("system.adapter.modbus.0");
		if (obj)
			modbusPVIsUp = obj.common.enabled;
		obj = await this.getForeignObjectAsync("system.adapter.sma-em.0");
		if (obj)
			smaIsUp = obj.common.enabled;
		obj = await this.getForeignObjectAsync("system.adapter.history.0");
		if (obj)
			historyIsUp = obj.common.enabled;
		obj = await this.getForeignObjectAsync("system.adapter.hm-rpc.2");
		if (obj)
			hmipIsUp = obj.common.enabled;

		if (!modbusPVIsUp || !smaIsUp || !historyIsUp || !hmipIsUp) {
			if (!modbusPVIsUp)
				this.log.error("modbus.0 (Photovoltaik) is not installed or running");

			if (!smaIsUp)
				this.log.error("sma-em.0 is not installed or running");

			if (!historyIsUp)
				this.log.error("history.0 is not installed or running");

			if (!hmipIsUp)
				this.log.error("hm-rpc.2 is not installed or running");

			const obj = await this.getForeignObjectAsync("system.adapter.energy.0");
			if (obj && obj.common.enabled != false) {
				await this.setAdapterOff();
			}
		}
		else {
			this.setForeignState("energy.admin.FOREIGN_ADAPTER_RUNNING", true);
			await this.p_BiberFunctions.globalStructure.getFolderStructure();
			await this.p_BiberFunctions.globalStructure.createFolder("ENERGY");
			await this.p_BiberFunctions.globalStructure.createAliases("ENERGY");
			await this.p_BiberFunctions.globalStructure.createDataStates("ENERGY");
			this.InitStates("modbus.0.inputRegisters.*");
			this.InitStates("sma-em.0.3002849260.*");
			this.InitStates("Home.Alias.Photovoltaik.*");
			this.InitStates("hm-rpc.2.*");
		}
	}

	/**
	 * @param {string} path  
	 */
	async InitStates(path) {
		this.log.info("Init: " + path);
		const dataObjArray = await this.getForeignObjectsAsync(path);
		if (dataObjArray)
			for (const key in dataObjArray) {
				if (key.search("PRE") != -1)
					continue;
				this.subscribeForeignStates(key);
			}
	}

	/**
	 * switch on the adapter
	 */
	async setAdapterOn() {
		const obj = await this.getForeignObjectAsync("system.adapter.energy.0");
		if (obj) {
			obj.common.enabled = true;  // Adapter anschalten
			await this.setForeignObjectAsync("system.adapter.energy.0", obj);
		}
	}

	/**
	 * switch off the adapter
	 */
	async setAdapterOff() {
		const obj = await this.getForeignObjectAsync("system.adapter.energy.0");
		if (obj) {
			obj.common.enabled = false;  // Adapter ausschalten
			await this.setForeignObjectAsync("system.adapter.energy.0", obj);
		}
	}

	/**
	 * get the adapter running status
	 */
	async AdapterIsUp() {
		const obj = await this.getForeignObjectAsync("system.adapter.energy.0");
		if (obj && obj.common.enabled != false) {
			this.setForeignState("energy.admin.ADAPTER_UP", true);
		}
		else {
			this.setForeignState("entergy.admin.ADAPTER_UP", false);
		}
	}

	/**
	 * saves the data states into backup file
	 */
	async save() {
		const obj = await this.getForeignObjectAsync("system.adapter.energy.0");
		if (obj && obj.common.enabled != false) {
			const content = new Map();
			let states = await this.getForeignStatesAsync("Home.Data.Energie.*");
			this.log.info("Save");
			for (const key in states) {
				content.set(key, states[key].val);
			}
			states = await this.getForeignStatesAsync("Home.Data.Photovoltaik.*");
			for (const key in states) {
				content.set(key, states[key].val);
			}
			this.log.debug(util.inspect(content));
			if (content.size > 0)
				try {
					const fileName = this.pathPrefix + "/backup/EnergyBackup_" + this.p_BiberFunctions.helper.timeStamp() + ".txt";
					this.log.info("Save: " + fileName);
					fs.writeFileSync(fileName, util.inspect(content));
				} catch (err) { this.log.error(err); }
		}
	}

	/**
	 * restores the data states from backup file
	 */
	async restore() {
		const obj = await this.getForeignObjectAsync("system.adapter.energy.0");
		this.log.info(util.inspect(obj));
		if (obj && obj.common.enabled != false) {
			const filePath = this.pathPrefix + "backup/EnergyBackup.txt";
			this.log.debug("Restore");
			try {
				const map = this.p_BiberFunctions.helper.convertStringMaptoMap(fs.readFileSync(filePath).toString());
				this.log.debug(util.inspect(map));
				map.forEach((value, key) => {
					if (parseFloat(value) > 0)
						// @ts-ignore
						this.setForeignStateAsync(key, parseFloat(value));
				});
			} catch (e) { this.log.error("Map: " + e); }
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Energy(options);
} else {
	// otherwise start the instance directly
	new Energy();
}