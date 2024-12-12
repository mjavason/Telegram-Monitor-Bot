"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingSelf = pingSelf;
const axios_1 = __importDefault(require("axios"));
async function pingSelf(url) {
    try {
        const { data } = await axios_1.default.get(url);
        console.log(`Server pinged successfully: ${data.message}`);
        return true;
    }
    catch (e) {
        console.error(`Error pinging server: ${e.message}`);
        return false;
    }
}
