/* eslint-disable indent */
const fs = require("fs");
const xmlParser = require("xml2json");
const ForeignAdapter = require("./adapter.js");
// eslint-disable-next-line no-unused-vars
const util = require("util");


class Structure {
    /**
    * @property {ForeignAdapter} foreignAdapter
    */

    /**
    * @property {Object} dataFolderXML
    */

    /**
    * @property {Object} aliasFolderXML
    */

    constructor(adapter) {
        this.adapter = adapter;

        this.foreignAdapter = new ForeignAdapter(adapter);
        this.dataFolderXML = null;
        this.aliasFolderXML = null;
    }

    /**
     * reads folder structure for data and aliases from xml file
     */
    async getFolderStructure() {
        let file = fs.readFileSync(this.adapter.pathPrefix + "config/DataFolder.xml");
        this.dataFolderXML = JSON.parse(xmlParser.toJson(file, { reversible: true }));
        file = fs.readFileSync(this.adapter.pathPrefix + "config/AliasFolder.xml");
        this.aliasFolderXML = JSON.parse(xmlParser.toJson(file, { reversible: true }));
    }

    async createStructure() {
        await this.getFolderStructure();
        await this.createFolder();
        await this.createAliases();
        await this.createDataStates();
    }

    /**
     * creates data states in data folder
     */
    async createDataStates() {
        const file = fs.readFileSync(this.adapter.pathPrefix + "config/DataStates.xml");
        const xml = JSON.parse(xmlParser.toJson(file, { reversible: true }));
        if (this.dataFolderXML["DATA"] && this.dataFolderXML["DATA"]["ENERGY"]) {
            const folderArray = this.dataFolderXML["DATA"]["ENERGY"]["item"];
            if (xml["DATA"] && xml["DATA"]["PV"]) {
                const statesArray = xml["DATA"]["PV"]["item"];
                for (const folderItem of folderArray) {
                    if (JSON.stringify(Object.keys(folderItem)[0]).search("Photovoltaik") != -1)
                        await this.crateDataState(folderItem, statesArray, "Photovoltaik", "");
                }
            }
            if (xml["DATA"] && xml["DATA"]["ENERGIE"]) {
                const statesArray = xml["DATA"]["ENERGIE"]["TOTAL"]["item"];
                for (const folderItem of folderArray) {
                    if (JSON.stringify(Object.keys(folderItem)[0]).search("Total") != -1
                        && JSON.stringify(Object.keys(folderItem)[0]).search("Energie") != -1)
                        await this.crateDataState(folderItem, statesArray, "Total", "Energie");
                }
            }
            if (xml["DATA"] && xml["DATA"]["ENERGIE"]) {
                const statesArray = xml["DATA"]["ENERGIE"]["OTHER"]["item"];
                for (const folderItem of folderArray) {
                    if (JSON.stringify(Object.keys(folderItem)[0]).search("Day") != -1
                        && JSON.stringify(Object.keys(folderItem)[0]).search("Energie") != -1)
                        await this.crateDataState(folderItem, statesArray, "Day", "Energie");
                }
                for (const folderItem of folderArray) {
                    if (JSON.stringify(Object.keys(folderItem)[0]).search("Week") != -1
                        && JSON.stringify(Object.keys(folderItem)[0]).search("Energie") != -1)
                        await this.crateDataState(folderItem, statesArray, "Week", "Energie");
                }
                for (const folderItem of folderArray) {
                    if (JSON.stringify(Object.keys(folderItem)[0]).search("Month") != -1
                        && JSON.stringify(Object.keys(folderItem)[0]).search("Energie") != -1)
                        await this.crateDataState(folderItem, statesArray, "Month", "Energie");
                }
                for (const folderItem of folderArray) {
                    if (JSON.stringify(Object.keys(folderItem)[0]).search("Year") != -1
                        && JSON.stringify(Object.keys(folderItem)[0]).search("Energie") != -1)
                        await this.crateDataState(folderItem, statesArray, "Year", "Energie");
                }
            }
        }
    }

    /**
     * Creates data state
     * @param {Object} folderItem
     * @param {Object} statesArray
     * @param {string} stateParent // parent folder
     * @param {string} device // device
     */
    async crateDataState(folderItem, statesArray, stateParent, device) {
        if (!Array.isArray(statesArray)) {
            const newStatesArray = new Array();
            newStatesArray.push(statesArray);
            statesArray = newStatesArray;
        }

        for (const key in statesArray) {
            if (!(stateParent == "Day" && Object.keys(statesArray[key])[0] == "ERTRAG")) {
                const obj = JSON.parse(Object.values(statesArray[key])[0]);
                const path = obj["common"]["name"] = Object.keys(folderItem)[0] + "." + Object.keys(statesArray[key])[0];
                if (obj["common"]["custom"]) {
                    obj["common"]["custom"]["history.0"]["aliasId"] = device + "_" + stateParent + "_" + obj["common"]["custom"]["history.0"]["aliasId"];
                }
                const def = obj.common.def;
                if (this.adapter.config.optionUpdateSourceObjects) {
                    await this.adapter.setForeignObjectAsync(path, obj);
                    await this.adapter.setForeignStateAsync(path, { val: def, ack: false });
                }
                else {
                    await this.adapter.setForeignObjectNotExists(path, obj);
                    // if (this.adapter.config.optionInitDataStructure)
                    //     this.adapter.setForeignState(path, { val: def, ack: false });
                }
            }
        }
    }

    /**
     * creates folder by config folder xml
     */
    async createFolder() {
        const dataFolderArray = this.dataFolderXML["DATA"]["ENERGY"]["item"];
        for (const folderItem of dataFolderArray) {
            await this.adapter.setForeignObjectNotExists(Object.keys(folderItem)[0], JSON.parse(Object.values(folderItem)[0]));
        }
        const aliasFolderArray = this.aliasFolderXML["ALIAS"]["ENERGY"]["item"];
        for (const folderItem of aliasFolderArray) {
            await this.adapter.setForeignObjectNotExists(Object.keys(folderItem)[0], JSON.parse(Object.values(folderItem)[0]));
        }
    }

    /**
     * craetes aliases for foreign device states
     */
    async createAliases() {
        const file = fs.readFileSync(this.adapter.pathPrefix + "config/AliasStates.xml");
        const xml = JSON.parse(xmlParser.toJson(file, { reversible: true }));

        await this.createAdapterAliases(xml, "Modbus_PV");
        await this.createAdapterAliases(xml, "SMA");
    }

    /**
     * creates aliases for foreign adapter source states
     * @param {JSON} xml
     * @param {string} adapterName
     */
    async createAdapterAliases(xml, adapterName) {
        const file = fs.readFileSync(this.adapter.pathPrefix + "config/AliasSourcePairs.xml");
        const pairedStatesXML = JSON.parse(xmlParser.toJson(file, { reversible: true }));
        let device = ""; let aliasPath = ""; let pairedStates = null;
        const adapterStatesArray = await this.foreignAdapter.getChildStates(adapterName);
        switch (adapterName) {
            case "Modbus_PV":
                device = "PV";
                aliasPath = "Home.Alias.Photovoltaik.";
                pairedStates = pairedStatesXML["PAIRS"]["PV_MODBUS"]["item"];
                break;
            case "SMA":
                device = "PV";
                aliasPath = "Home.Alias.Photovoltaik.";
                pairedStates = pairedStatesXML["PAIRS"]["SMA"]["item"];
                break;
            default:
        }
        if (!Array.isArray(pairedStates)) {
            const newPairedStatesArray = new Array();
            newPairedStatesArray.push(pairedStates);
            pairedStates = newPairedStatesArray;
        }

        if (xml["ALIAS"][device] && adapterStatesArray) {
            // xml part states of given device
            let statesArray = xml["ALIAS"][device]["item"];
            if (!Array.isArray(statesArray)) {
                const newStatesArray = new Array();
                newStatesArray.push(statesArray);
                statesArray = newStatesArray;
            }
            // object array to provide the source ids and value for first update of alias states
            const sourceValueObjectArray = new Object();
            // loop all states for new alias state of given device
            for (const index in statesArray) {
                let newAliasPath = aliasPath;
                // xml part of paired states because alias state id is not similar to source id
                for (const key in pairedStates) {
                    // matched state ids of alias state xml and paired state xml
                    if (Object.keys(pairedStates[key]).toString() == Object.keys(statesArray[index])[0]) {
                        // alias path of alias folder path part and alias state suffix (key from alias state xml)
                        newAliasPath += Object.keys(statesArray[index])[0];
                        // obj of new alias state (value of alias state xml)
                        const obj = JSON.parse(statesArray[index][Object.keys(statesArray[index])[0]]);
                        // update of new alias state object with alias state path as name
                        obj["common"]["name"] = newAliasPath;
                        // store the id of source state for alias state in new alias state object
                        obj["common"]["alias"]["id"] = Object.values(pairedStates[key])[0];
                        // get the object of source state for new alias state
                        const foreignObj = await this.adapter.getForeignObjectAsync(Object.values(pairedStates[key])[0]);
                        if (foreignObj) {
                            // update the source obj with new alias state path
                            foreignObj["native"]["aliasID"] = newAliasPath;
                            // forced update Object or set object if not exists
                            if (this.adapter.config.optionUpdateSourceObjects) {
                                await this.adapter.setForeignObject(Object.values(pairedStates[key])[0], foreignObj);
                                await this.adapter.setForeignObject(newAliasPath, obj);
                            }
                            else
                                // create and subscribe new alias state
                                await this.adapter.setForeignObjectNotExists(newAliasPath, obj);
                            // store id and value in object array
                            const state = await this.adapter.getForeignStateAsync(Object.values(pairedStates[key])[0]);
                            if (state && !sourceValueObjectArray[Object.values(pairedStates[key])[0]]) {
                                const newState = await this.adapter.update.updateAliasLogic(newAliasPath, state);
                                sourceValueObjectArray[newAliasPath] = newState;
                            }
                        }
                    }
                }
            }

            for (const key in sourceValueObjectArray) {
                this.adapter.setForeignState(key, sourceValueObjectArray[key]);
            }
        }
    }
}

module.exports = Structure;