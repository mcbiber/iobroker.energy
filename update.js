
// eslint-disable-next-line no-unused-vars
const { ok } = require("assert");
// eslint-disable-next-line no-unused-vars
const util = require("util");
// eslint-disable-next-line no-unused-vars
const Helper = require("./helper.js");

/* eslint-disable indent */
class Update {

    /**
     * @property {string} RED
     */

    /**
     * @property {string} GREEN
     */

    /**
     * @property {string} BLUE
     */

    /**
     * @property {string} YELLOW
     */

    /**
     * @property {string} BLACK
     */

    /**
     * @property {string} WHITE
     */

    /**
     * @property {string} PASSIV
     */

    /**
     * @property {string} AKTIV
     */

    /**
     * @property {string} OK
     */

    /**
     * @property {string} NOK
     */

    /**
     * @property {string} OPEN
     */

    /**
     * @property {string} CLOSED
     */

    /**
     * @property {string} LEER
     */

    /**
     * @property {string} VOLL
     */

    /**
     * @property {string} OPENED
     */

    /**
     * @property {string} LOCKED
     */

    /**
     * Constructor with parent adapter pointer
     * @param {*} adapter
     */
    constructor(adapter) {
        this.adapter = adapter;

        this.RED = "#F44336";
        this.GREEN = "#4CAF50";
        this.BLUE = "#2196F3";
        this.YELLOW = "#FFDB3B";
        this.BLACK = "#000000";
        this.WHITE = "#FFFFFF";
        this.PASSIV = "passiv";
        this.AKTIV = "aktiv";
        this.OK = "OK";
        this.NOK = "NOK";
        this.OPEN = "offen";
        this.CLOSED = "geschlossen";
        this.VOLL = "voll";
        this.LEER = "leer";
        this.OPENED = "geöffnet";
        this.LOCKED = "verriegelt";
    }

    /**
     * Updates target id with given source state and source id
     * @param {string} sourceID
     * @param {Object} sourceState
     */
    updateTarget(sourceID, sourceState) {
        if (sourceID && sourceState.ack == true) {
            if (sourceID.search("Alias") == -1)
                this.updateAlias(sourceID, sourceState);
            else
                this.updateOrigin(sourceID, sourceState);
        }
    }

    /**
     * updates the origin id by given alias id and alias state
     * @param {string} aliasID
     * @param {Object} aliasState
     */
    async updateOrigin(aliasID, aliasState) {
        const obj = await this.adapter.getForeignObjectAsync(aliasID);
        if (obj) {
            if (obj.native && !obj.native["uni-directional"]) {
                const id = obj.common.alias.id;
                await this.adapter.setForeignState(id, { val: aliasState.val, ack: true });
                await this.adapter.setForeignState(id, { val: aliasState.val, ack: false });
            }
        }
    }

    /**
     * updates the alias state by given source id and source state
     * @param {string} originPath
     * @param {Object} state
     */
    async updateAlias(originPath, state) {
        const obj = await this.adapter.getForeignObjectAsync(originPath);
        if (obj.native.aliasID) {
            const ids = (obj.native.aliasID).split(",");
            for (const element of ids) {
                const value = await this.adapter.getForeignStateAsync(element);
                if (value.val != state.val) {
                    const sourceValue = await this.updateAliasLogic(element, state);
                    this.adapter.setForeignState(element, { val: sourceValue, ack: false });
                }
            }
        }
    }

    /**
     * converts state value by given state id path
     * @param {string} path
     * @param {Object} state
     * @returns converted states value depending from alias id
     */
    updateAliasLogic(path, state) {
        const splitStr = path.split(".");
        const str = splitStr[splitStr.length - 1];
        if (str == "SMA_ERTRAG_AKTUELL" || str == "SMA_TAGESERTRAG") {
            if (state.val < 0)
                return 0;
        }

        return state.val;
    }
}

module.exports = Update;