"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kaspa_1 = __importDefault(require("./kaspa"));
const transaction_1 = require("./transaction");
exports.default = {
    Kaspa: kaspa_1.default,
    TransactionInput: transaction_1.TransactionInput,
    TransactionOutput: transaction_1.TransactionOutput,
    Transaction: transaction_1.Transaction,
};
//# sourceMappingURL=index.js.map