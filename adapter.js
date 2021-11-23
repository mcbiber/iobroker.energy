/* eslint-disable indent */


// eslint-disable-next-line no-unused-vars
const util = require("util");

class ForeignAdapter {
    constructor(adapter) {
        this.adapter = adapter;
    }

    /**
     * Gets all childstates from given ID path
     * @param {string} adapterName
     * @returns childStates
     */
    async getChildStates(adapterName) {
        let childStates;
        const childArray = new Array();
        switch(adapterName){
            case "Mercedes_Me":
                childStates = await this.adapter.getForeignStatesAsync("mercedesme.0.WDF44781313559904.state.*");
                break;
            case "HMIP":
                break;
            default:
        }

        for (const key in childStates){
            if(childStates[key] != null)
            childArray.push(key);
        }

        return childArray;
    }
}

module.exports = ForeignAdapter;