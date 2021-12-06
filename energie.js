/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */

const schedule = require("node-schedule");

let Ertrag_aktuell = 0;
let Netzeinspeisung = 0;
let Netzbezug = 0;
let Eigenverbrauch = 0;
let GesamtVerbrauch = 0;
let Vergütung = 0;
let Kosten = 0;

class Energie {
    constructor(adapter) {
        this.adapter = adapter;
    }

    setErtrag(value) { Ertrag_aktuell = value; }
    getErtrag() { return Ertrag_aktuell; }
    setNetzeinspeisung(value) { Netzeinspeisung = value; }
    getNetzeispeisung() { return Netzeinspeisung; }
    setNetzbezug(value) { Netzbezug = value; }
    getNetzbezug() { return Netzbezug; }
    setEigenverbrauch(value) { Eigenverbrauch = value; }
    getEigenverbrauch() { return Eigenverbrauch; }
    setGesamtverbrauch(value) { GesamtVerbrauch = value; }
    getGesamtverbrauch() { return GesamtVerbrauch; }
    setVerguetung(value) { Vergütung = value; }
    getVerguetung() { return Vergütung; }
    setKosten(value) { Kosten = value; }
    getKosten() { return Kosten; }

    /**
     * calculates current energy
     */
    async countEnergy() {
        schedule.scheduleJob("* * * * * *", async () => { // 1s scheduling
            this.calcEnergy();
        });
    }

    /**
     * calculates several energy in summary
     */
    async countGesamt() {
        schedule.scheduleJob("* * * * * *", async () => { // 1s scheduling
            this.calcGesamt();
        });
    }

    /**
     * timer to set several energy states daily at 00:01:10
     */
    async setDaily() {
        schedule.scheduleJob("10 1 0 * * *", async () => { // every day at 00:01:10)
            await this.setVerbrauchVortag();
            await this.setBezugVortag();
            await this.setEinspeisungVortag();
            await this.setErtragVortag();
            await this.setEigenverbrauchVortag();
            await this.setVerbrauchWoche();
            await this.setBezugWoche();
            await this.setEinspeisungWoche();
            await this.setEigenverbrauchWoche();
            await this.setErtragWoche();
            await this.setBezugMonat();
            await this.setVerbrauchMonat();
            await this.setEinspeisungMonat();
            await this.setEigenverbrauchMonat();
            await this.setErtragMonat();
            await this.setBezugJahr();
            await this.setVerbrauchJahr();
            await this.setEinspeisungJahr();
            await this.setEigenverbrauchJahr();
            await this.setErtragJahr();
        });
    }

    /**
     * timer to set several energy states daily at every minute
     */
    async setMinutely() {
        schedule.scheduleJob("* * * * *", async () => { // every minute
            await this.setVerbrauchTag();
            await this.setBezugTag();
            await this.setEinspeisungTag();
            await this.setEigenverbrauchTag();
        });
    }

    /**
     * timer to set several energy states weekly at monday 00:01:15
     */
    async setWeekly() {
        schedule.scheduleJob("15 1 0 * * 1", async () => { // Um 00:01:15 am Montag
            await this.setVerbrauchVorwoche();
            await this.setBezugVorwoche();
            await this.setEigenverbrauchVorwoche();
            await this.setErtragVorwoche();
            await this.setEinspeisungVorwoche();
        });
    }

    /**
     * timer to set several energy states monthly every first day of month at 00:01:05
     */
    async setMonthly() {
        schedule.scheduleJob("5 1 0 1 * *", async () => { //Um 00:01:05 am 1 im jeden Monat
            await this.setBezugVormonat();
            await this.setVerbrauchVormonat();
            await this.setEinspeisungVormonat();
            await this.setEigenverbrauchVormonat();
            await this.setErtragVormonat();
        });
    }

    async setYearly() {
        schedule.scheduleJob("20 1 0 1 1 *", async () => { // Um 00:01:20 am 1 im Januar
            await this.setBezugVorjahr();
            await this.setVerbrauchVorjahr();
            await this.setEinspeisungVorjahr();
            await this.setEigenverbrauchVorjahr();
            await this.setErtragVorjahr();
        });
    }

    /**
     * sets yield of year before by defined time frame
     */
    async setErtragVorjahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Yield",
                this.adapter.p_BiberFunctions.helper.getStartTimeYear(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeYear(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Year.PRE_ERTRAG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.ERTRAG", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets own consumption of year before by defined time frame
     */
    async setEigenverbrauchVorjahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeYear(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeYear(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Year.PRE_EIGENVERBRAUCH", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.EIGENVERBRAUCH", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets feed of year before by defined time frame
     */
    async setEinspeisungVorjahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeYear(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeYear(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Year.PRE_EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.PRE_EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
                this.adapter.setForeignState("Home.Data.Energie.Year.EINSPEISUNG", 0);
                this.adapter.setForeignState("Home.Data.Energie.Year.EINSPEISUNG_VERGÜTUNG", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets consumption year before by defined time frame
     */
    async setVerbrauchVorjahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeYear(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeYear(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Year.PRE_VERBRAUCH", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.VERBRAUCH", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets receive year before by defined time frame
     */
    async setBezugVorjahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeYear(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeYear(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Year.PRE_BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.PRE_BEZUGSKOSTEN", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.BEZUG", 0);
                this.adapter.setForeignState("Home.Data.Energie.Year.BEZUGSKOSTEN", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets yield of month before by defined time frame
     */
    async setErtragVormonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Yield",
                this.adapter.p_BiberFunctions.helper.getStartTimeMonth(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeMonth(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Month.PRE_ERTRAG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Month.ERTRAG", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets own consumption of month before by defined time frame
     */
    async setEigenverbrauchVormonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeMonth(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeMonth(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Month.PRE_EIGENVERBRAUCH", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Month.EIGENVERBRAUCH", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets feed of month before by defined time frame
     */
    async setEinspeisungVormonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeMonth(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeMonth(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Month.PRE_EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Month.PRE_EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
                this.adapter.setForeignState("Home.Data.Energie.Month.EINSPEISUNG", 0);
                this.adapter.setForeignState("Home.Data.Energie.Month.EINSPEISUNG_VERGÜTUNG", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets consumption of month before by defined time frame
     */
    async setVerbrauchVormonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeMonth(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeMonth(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Month.PRE_VERBRAUCH", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Month.VERBRAUCH", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets receive of month before by defined time frame
     */
    async setBezugVormonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeMonth(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeMonth(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Month.PRE_BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Month.PRE_BEZUGSKOSTEN", { val: result * this.getKosten() });
                this.adapter.setForeignState("Home.Data.Energie.Month.BEZUGSKOSTEN", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets feed of week before by defined time frame
     */
    async setEinspeisungVorwoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeWeek(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeWeek(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Week.PRE_EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Week.PRE_EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
                this.adapter.setForeignState("Home.Data.Energie.Week.EINSPEISUNG", 0);
                this.adapter.setForeignState("Home.Data.Energie.Week.EINSPEISUNG_VERGÜTUNG", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets yield week before by defined time frame
     */
    async setErtragVorwoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Yield",
                this.adapter.p_BiberFunctions.helper.getStartTimeWeek(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeWeek(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Week.PRE_ERTRAG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Week.ERTRAG", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets own consumption week before by defined time frame
     */
    async setEigenverbrauchVorwoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeWeek(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeWeek(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Week.PRE_EIGENVERBRAUCH", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Week.EIGENVERBRAUCH", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets receive week before by defined time frame
     */
    async setBezugVorwoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeWeek(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeWeek(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Week.PRE_BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Week.PRE_BEZUGSKOSTEN", { val: result * this.getKosten() });
                this.adapter.setForeignState("Home.Data.Energie.Week.BEZUG", 0);
                this.adapter.setForeignState("Home.Data.Energie.Week.BEZUGSKOSTEN", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets consumption week before by defined time frame
     */
    async setVerbrauchVorwoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeWeek(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeWeek(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Week.PRE_VERBRAUCH", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Week.VERBRAUCH", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the own consumption of current day by defined time frame
     */
    async setEigenverbrauchTag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeToDay(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Day.EIGENVERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the feed of current day by specivied time
     */
    async setEinspeisungTag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeToDay(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Day.EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Day.EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the receive of current day by specified time
     */
    async setBezugTag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeToDay(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Day.BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Day.BEZUGSKOSTEN", { val: result * this.getKosten() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the consumption of the day by specified time
     */
    async setVerbrauchTag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeToDay(), new Date().getTime());
            if (result >= 0)
                // @ts-ignore
                this.adapter.setForeignState("Home.Data.Energie.Day.VERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the yield of current year by specified time
     */
    async setErtragJahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Yield",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisYear(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Year.ERTRAG", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the own consumption of current year by specified time
     */
    async setEigenverbrauchJahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisYear(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Year.EIGENVERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the feed of current year by specified time
     */
    async setEinspeisungJahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisYear(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Year.EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the consumption of current year by specified time
     */
    async setVerbrauchJahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisYear(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Year.VERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the receive of current year by specified time
     */
    async setBezugJahr() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisYear(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Year.BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Year.BEZUGSKOSTEN", { val: result * this.getKosten() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the yield of current month by specified time
     */
    async setErtragMonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Yield",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisMonth(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Month.ERTRAG", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the own consumption of current month by specified time
     */
    async setEigenverbrauchMonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisMonth(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Month.EIGENVERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the feed of current month by specified time
     */
    async setEinspeisungMonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisMonth(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Month.EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Month.EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the consumpion of ccurent month by specified time
     */
    async setVerbrauchMonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisMonth(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Month.VERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the receive of current month by specified time
     */
    async setBezugMonat() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisMonth(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Month.BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Month.BEZUGSKOSTEN", { val: result * this.getKosten() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the yield of current week by specified time
     */
    async setErtragWoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Yield",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisWeek(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Week.ERTRAG", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets thw own consumption of current week with specified time
     */
    async setEigenverbrauchWoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisWeek(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Week.EIGENVERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets feed of current week to specified time
     */
    async setEinspeisungWoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisWeek(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Week.EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Week.EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the receive of current week to specified time
     */
    async setBezugWoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisWeek(), new Date().getTime());
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Week.BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Week.BEZUGSKOSTEN", { val: result * this.getKosten() });
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets consumption of current week to specified time
     */
    async setVerbrauchWoche() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeThisWeek(), new Date().getTime());
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Week.VERBRAUCH", { val: result });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the own consumption of day before
     */
    async setEigenverbrauchVortag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Ownconsumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeDay(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeDay(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Day.PRE_EIGENVERBRAUCH", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Day.EIGENVERBRAUCH", 0);
            }
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the yield of day before
     */
    async setErtragVortag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Yield",
                this.adapter.p_BiberFunctions.helper.getStartTimeDay(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeDay(1));
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Day.PRE_ERTRAG", result);
            this.adapter.getForeignState("Home.Data.Photovoltaik.SMA_ERTRAG_MAX", (err, state) => {
                this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_PRE_ERTRAG_MAX", state.val);
                this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_ERTRAG_MAX", 0);
            });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the feed of day before
     */
    async setEinspeisungVortag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Feed",
                this.adapter.p_BiberFunctions.helper.getStartTimeDay(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeDay(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Day.PRE_EINSPEISUNG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Day.PRE_EINSPEISUNG_VERGÜTUNG", { val: result * this.getVerguetung() });
            }
            this.adapter.setForeignState("Home.Data.Energie.Day.EINSPEISUNG", 0);
            this.adapter.setForeignState("Home.Data.Energie.Day.PRE_EINSPEISUNG_VERGÜTUNG", 0);
            this.adapter.getForeignState("Home.Data.Photovoltaik.SMA_NETZEINSPEISUNG_MAX", (err, state) => {
                this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_PRE_NETZEINSPEISUNG_MAX", state.val);
                this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_NETZEINSPEISUNG_MAX", 0);
            });
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the receive of dey before
     */
    async setBezugVortag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Receive",
                this.adapter.p_BiberFunctions.helper.getStartTimeDay(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeDay(1));
            if (result >= 0) {
                this.adapter.setForeignState("Home.Data.Energie.Day.PRE_BEZUG", { val: result });
                this.adapter.setForeignState("Home.Data.Energie.Day.PRE_BEZUGSKOSTEN", { val: result * this.getKosten() });
            }
            this.adapter.setForeignState("Home.Data.Energie.Day.BEZUG", 0);
            this.adapter.setForeignState("Home.Data.Energie.Day.BEZUGSKOSTEN", 0);
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * sets the consumption of day before
     */
    async setVerbrauchVortag() {
        try {
            const result = await this.getHistoryData("Energie_Total_Consumption",
                this.adapter.p_BiberFunctions.helper.getStartTimeDay(1),
                this.adapter.p_BiberFunctions.helper.getEndTimeDay(1));
            if (result >= 0)
                this.adapter.setForeignState("Home.Data.Energie.Day.PRE_VERBRAUCH", { val: result });
            this.adapter.setForeignState("Home.Data.Energie.Day.VERBRAUCH", 0);
            // eslint-disable-next-line no-empty
        } catch (reject) { this.adapter.log.error(reject); }
    }

    /**
     * calcualates and set the several current energy states
     */
    calcEnergy() {
        if (this.getErtrag() < 0) {
            this.setErtrag(0);
        }

        this.setEigenverbrauch(this.getNetzeispeisung() == 0 ? this.getErtrag() : this.getErtrag() - this.getNetzeispeisung());
        this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_EIGENVERBRAUCH", { val: this.getEigenverbrauch() < 0 ? 0 : this.getEigenverbrauch() });

        if (this.getErtrag() <= 0) {
            this.setGesamtverbrauch(Math.round((this.getNetzbezug() * 1000) / 1000));
        }
        else if (this.getNetzeispeisung() <= 0) {
            this.setGesamtverbrauch(Math.round(((this.getNetzbezug() + this.getErtrag()) * 1000) / 1000));
        }
        else {
            this.setGesamtverbrauch(Math.round(((this.getErtrag() - this.getNetzeispeisung()) * 1000) / 1000));
        }
        this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_VERBRAUCH", this.getGesamtverbrauch());
    }

    async calcGesamt() {
        // System Energiezähler Gesamtverbrauch
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Energie.Total.VERBRAUCH", (err, state) => {
            const result = ((state.val * 3600000) + this.getGesamtverbrauch()) / 3600000;
            this.adapter.setForeignState("Home.Data.Energie.Total.VERBRAUCH", { val: result > 0 ? result : 0 });
        });
        // System Energiezähler Gesamtertrag
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Energie.Total.ERTRAG", (err, state) => {
            const result = ((state.val * 3600000) + this.getErtrag()) / 3600000;
            this.adapter.setForeignState("Home.Data.Energie.Total.ERTRAG", { val: result > 0 ? result : 0 });
        });
        // System Energiezähler Gesamteinspeisung
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Energie.Total.EINSPEISUNG", (err, state) => {
            const result = ((state.val * 3600000) + this.getNetzeispeisung()) / 3600000;
            this.adapter.setForeignState("Home.Data.Energie.Total.EINSPEISUNG", { val: result > 0 ? result : 0 });
            this.adapter.setForeignState("Home.Data.Energie.Total.EINSPEISUNG_VERGÜTUNG", { val: this.getVerguetung() * state.val });
        });
        // System Energiezähler Gesamtbezug
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Energie.Total.BEZUG", (err, state) => {
            const result = ((state.val * 3600000) + this.getNetzbezug()) / 3600000;
            this.adapter.setForeignState("Home.Data.Energie.Total.BEZUG", { val: result > 0 ? result : 0 });
            this.adapter.setForeignState("Home.Data.Energie.Total.BEZUGSKOSTEN", { val: this.getKosten() * state.val });
        });
        // System Energiezähler Eigenverbrauch gesamt
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Energie.Total.EIGENVERBRAUCH", (err, state) => {
            const result = ((state.val * 3600000) + this.getEigenverbrauch()) / 3600000;
            this.adapter.setForeignState("Home.Data.Energie.Total.EIGENVERBRAUCH", { val: result > 0 ? result : 0 });
        });
    }

    /**
     * calculates yield max by given value of current yield
     * @param {Object} in_State 
     */
    async calcMaxErtrag(in_State) {
        this.setErtrag(in_State.val);
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Photovoltaik.SMA_ERTRAG_MAX", (err, state) => {
            if (in_State.val > state.val)
                this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_ERTRAG_MAX", in_State.val);
        });
    }

    /**
     * calculates feed max by given current feed
     * @param {Object} in_State 
     */
    async calcMaxNetzEinspeisung(in_State) {
        this.setNetzeinspeisung(in_State.val);
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Photovoltaik.SMA_NETZEINSPEISUNG_MAX", (err, state) => {
            if (in_State.val > state.val)
                this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_NETZEINSPEISUNG_MAX", in_State.val);
        });
    }

    /**
     * calculates current quote by given yiled
     * @param {Object} in_State 
     */
    async calcQuotes(in_State) {
        // @ts-ignore
        this.adapter.getForeignState("Home.Data.Photovoltaik.SMA_EIGENVERBRAUCH", (err, state) => { this.setEigenverbrauch(state.val); });
        const result = Math.round(this.getEigenverbrauch() / in_State.val * 100);
        this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_EIGENVERBRAUCH_QUOTE", { val: in_State.val == 0 ? 0 : result > 100 ? 100 : result < 0 ? 0 : result });

        if (this.getEigenverbrauch() == 0)
            this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_AUTARKIE_QUOTE", 0);
        else {
            const result = Math.round((this.getEigenverbrauch() / this.getGesamtverbrauch()) * 100);
            this.adapter.setForeignState("Home.Data.Photovoltaik.SMA_AUTARKIE_QUOTE", { val: result < 0 ? 0 : result });
        }
    }

    async getHistoryData(historyFile, startTime, endTime) {
        // eslint-disable-next-line no-unused-vars
        return await new Promise((resolve, reject) => {
            this.adapter.sendTo("history.0", "getHistory", {
                id: historyFile,
                options: {
                    start: startTime,
                    end: endTime,
                    aggregate: "average"
                }
            }, (result) => {
                let start = 0;
                // @ts-ignore
                for (let i = 0; i < result.result.length; i++) {
                    // @ts-ignore
                    if (result.result[i].val != null && result.result[i].val > 0) {
                        // @ts-ignore
                        start = result.result[i].val;
                        break;
                    }
                }
                let end = 0;
                // @ts-ignore
                for (let i = result.result.length - 1; i >= 0; i--) {
                    // @ts-ignore
                    if (result.result[i].val != null && result.result[i].val > 0) {
                        // @ts-ignore
                        end = result.result[i].val;
                        break;
                    }
                }
                // @ts-ignore
                resolve(end - start);
            });
        });
    }
}

module.exports = Energie;