/* eslint-disable indent */
// eslint-disable-next-line no-unused-vars
const util = require("util");


class Structure {

    constructor(adapter) {
        this.adapter = adapter;
    }

    async createStructure() {
        await this.adapter.p_BiberFunctions.globalStructure.getFolderStructure();
        await this.adapter.p_BiberFunctions.globalStructure.createFolder("ENERGY");
        await this.adapter.p_BiberFunctions.globalStructure.createAliases("ENERGY");
        await this.adapter.p_BiberFunctions.globalStructure.createDataStates("ENERGY");
    }
}

module.exports = Structure;