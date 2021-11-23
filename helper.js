/* eslint-disable indent */
/* eslint-disable no-trailing-spaces */


class Helper {

    static timeStamp() {
        // Create a date object with the current time
        const now = new Date();

        // Create an array with the current month, day and time
        const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];

        // Create an array with the current hour, minute and second
        const time = [now.getHours(), now.getMinutes(), now.getSeconds()];

        // If seconds and minutes are less than 10, add a zero
        for (let i = 1; i < 3; i++) {
            if (time[i] < 10) {
                time[i] = 0 + time[i];
            }
        }

        // Return the formatted string
        return date.join("_") + "_" + time.join("_");
    }

    /**
     * Converts map in string into javascript map
     * @param {string} in_StringMap
     * @returns javascript map
     */
    static convertStringMaptoMap(in_StringMap) {
        let subContent = in_StringMap.substring(in_StringMap.search(" "), in_StringMap.length);
        subContent = subContent.substring(subContent.lastIndexOf("{") + 1, subContent.lastIndexOf("}"));
        subContent = subContent.split("'").join("");
        subContent = subContent.split(" ").join("");
        subContent = subContent.split("\n").join("");
        const subStr = subContent.split(",");
        const out_Map = new Map();
        subStr.forEach((element) => {
            const splitStr = element.split("=>");
            splitStr[0] = splitStr[0].replace("energie.0. ", "");
            out_Map.set(splitStr[0], parseFloat(splitStr[1]));
        });
        return out_Map;
    }

    static getStartTimeDay(minusTag) {
        const now = new Date().getTime();
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() - minusTag);
        return startTime.getTime();
    }

    static getEndTimeDay(minusTag) {
        const now = new Date().getTime();
        const startTime = new Date(now);
        startTime.setSeconds(59);
        startTime.setMinutes(59);
        startTime.setHours(23);
        startTime.setDate(startTime.getDate() - minusTag);
        return startTime.getTime();
    }

    static getStartTimeToDay() {
        const now = new Date().getTime();
        const startTime = new Date(now);
        startTime.setSeconds(0);
        startTime.setMinutes(0);
        startTime.setHours(0);
        return startTime.getTime();
    }

    static getStartTimeThisWeek() {
        const now = new Date().getTime();
        let startTime = new Date(now);
        startTime = this.wochenanfang(startTime);
        startTime.setSeconds(0);
        startTime.setMinutes(0);
        startTime.setHours(0);
        return startTime.getTime();
    }

    static getStartTimeThisMonth() {
        const now = new Date().getTime();
        let startTime = new Date(now);
        startTime = this.monatsanfang(startTime);
        startTime.setSeconds(0);
        startTime.setMinutes(0);
        startTime.setHours(0);
        return startTime.getTime();
    }

    static getStartTimeThisYear() {
        const now = new Date().getTime();
        const startTime = new Date(now);
        startTime.setSeconds(0);
        startTime.setMinutes(0);
        startTime.setHours(0);
        startTime.setDate(1);
        startTime.setMonth(0);
        return startTime.getTime();
    }

    static getStartTimeWeek(minusWoche) {
        const now = new Date().getTime();
        let startTime = new Date(now);
        startTime.setDate(startTime.getDate() - (7 * minusWoche));
        startTime = this.wochenanfang(startTime);
        startTime.setSeconds(0);
        startTime.setMinutes(0);
        startTime.setHours(0);
        return startTime.getTime();
    }

    static getEndTimeWeek(minusWoche) {
        const endTime = new Date(this.getStartTimeWeek(minusWoche));
        endTime.setSeconds(59);
        endTime.setMinutes(59);
        endTime.setHours(23);
        endTime.setDate(endTime.getDate() + 6);
        return endTime.getTime();
    }

    static getStartTimeMonth(minusMonth) {
        const now = new Date().getTime();
        let startTime = new Date(now);
        startTime.setMonth(startTime.getMonth() - minusMonth);
        startTime = this.monatsanfang(startTime);
        startTime.setSeconds(0);
        startTime.setMinutes(0);
        startTime.setHours(0);
        return startTime.getTime();
    }

    static getEndTimeMonth(minusMonth) {
        const now = new Date().getTime();
        let endTime = new Date(now);
        endTime.setMonth(endTime.getMonth() - minusMonth);
        endTime = this.monatsende(endTime);
        endTime.setSeconds(59);
        endTime.setMinutes(59);
        endTime.setHours(23);
        return endTime.getTime();
    }

    static getStartTimeYear(minusJahr) {
        const now = new Date().getTime();
        const startTime = new Date(now);
        startTime.setSeconds(0);
        startTime.setMinutes(0);
        startTime.setHours(0);
        startTime.setFullYear(startTime.getFullYear() - minusJahr);
        startTime.setMonth(0);
        startTime.setDate(1);
        return startTime.getTime();
    }

    static getEndTimeYear(minusJahr) {
        const now = new Date().getTime();
        const endTime = new Date(now);
        endTime.setSeconds(59);
        endTime.setMinutes(59);
        endTime.setHours(23);
        endTime.setFullYear(endTime.getFullYear() - minusJahr);
        endTime.setMonth(11);
        endTime.setDate(31);
        return endTime.getTime();
    }

    static monatsende(date) {
        date.setMonth(date.getMonth() + 1);
        date.setDate(this.monatsanfang(date).getDate() - 1);
        return date;
    }

    static monatsanfang(date) {
        const anfang = new Date(date);
        anfang.setDate(anfang.getDate() + 1 - anfang.getDate());
        return anfang;
    }

    /**
     * Gets date of beginnig of the week of given date
     * @param {Date} date 
     * @returns date
     */
    static wochenanfang(date) {
        const iDayOfWeek = date.getDay();
        const iDifference = date.getDate() - iDayOfWeek + (iDayOfWeek === 0 ? -6 : 1);
        return new Date(date.setDate(iDifference));
    }
}

module.exports = Helper;