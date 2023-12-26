"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.TransactionOutput = exports.TransactionInput = void 0;
const kaspa_1 = __importDefault(require("./kaspa"));
var transaction_1 = require("./transaction");
Object.defineProperty(exports, "TransactionInput", { enumerable: true, get: function () { return transaction_1.TransactionInput; } });
Object.defineProperty(exports, "TransactionOutput", { enumerable: true, get: function () { return transaction_1.TransactionOutput; } });
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return transaction_1.Transaction; } });
exports.default = kaspa_1.default;
//# sourceMappingURL=index.js.map