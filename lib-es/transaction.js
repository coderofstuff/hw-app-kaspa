import BN from "bn.js";
export class Transaction {
    constructor(txData) {
        var _a, _b, _c;
        /**
         * @type {TransactionInput[]}
         */
        this.inputs = txData.inputs;
        /**
         * @type {TransactionOutput[]}
         */
        this.outputs = txData.outputs;
        /**
         * @type {int}
         */
        this.version = txData.version;
        this.changeAddressType = (_a = txData.changeAddressType) !== null && _a !== void 0 ? _a : 0;
        this.changeAddressIndex = (_b = txData.changeAddressIndex) !== null && _b !== void 0 ? _b : 0;
        this.account = (_c = txData.account) !== null && _c !== void 0 ? _c : 0x80000000;
        if (!(this.changeAddressType === 0 || this.changeAddressType === 1)) {
            throw new Error(`changeAddressType must be 0 or 1 if set`);
        }
        if (this.account < 0x80000000 || this.account > 0xFFFFFFFF) {
            throw new Error('account must be between 0x80000000 and 0xFFFFFFFF');
        }
        if (this.changeAddressIndex < 0x00000000 || this.changeAddressIndex > 0xFFFFFFFF) {
            throw new Error(`changeAddressIndex must be between 0x00000000 and 0xFFFFFFFF`);
        }
    }
    serialize() {
        const versionBuf = Buffer.alloc(2);
        versionBuf.writeUInt16BE(this.version);
        const outputLenBuf = Buffer.alloc(1);
        outputLenBuf.writeUInt8(this.outputs.length);
        const inputLenBuf = Buffer.alloc(1);
        inputLenBuf.writeUInt8(this.inputs.length);
        const changeAddressTypeBuf = Buffer.alloc(1);
        changeAddressTypeBuf.writeUInt8(this.changeAddressType);
        const changeAddressIndexBuf = Buffer.alloc(4);
        changeAddressIndexBuf.writeUInt32BE(this.changeAddressIndex);
        const accountBuf = Buffer.alloc(4);
        accountBuf.writeUInt32BE(this.account);
        return Buffer.concat([
            versionBuf,
            outputLenBuf,
            inputLenBuf,
            changeAddressTypeBuf,
            changeAddressIndexBuf,
            accountBuf,
        ]);
    }
    /**
     * Convert this transaction to a JSON object that api.kaspa.org will accept
     */
    toApiJSON() {
        return {
            transaction: {
                version: this.version,
                inputs: this.inputs.map((i) => i.toApiJSON()),
                outputs: this.outputs.map((o) => o.toApiJSON()),
                lockTime: 0,
                subnetworkId: '0000000000000000000000000000000000000000',
            },
        };
    }
}
export class TransactionInput {
    constructor(inputData) {
        this.value = inputData.value;
        this.prevTxId = inputData.prevTxId;
        this.outpointIndex = inputData.outpointIndex;
        this.addressType = inputData.addressType;
        this.addressIndex = inputData.addressIndex;
        this.signature = null;
        this.sighash = null;
    }
    serialize() {
        const valueBuf = Buffer.from(new BN(this.value).toArray('BE', 8));
        const addressTypeBuf = Buffer.alloc(1);
        addressTypeBuf.writeUInt8(this.addressType);
        const addressIndexBuf = Buffer.alloc(4);
        addressIndexBuf.writeUInt32BE(this.addressIndex);
        const outpointIndexBuf = Buffer.alloc(1);
        outpointIndexBuf.writeUInt8(this.outpointIndex);
        return Buffer.concat([
            valueBuf,
            Buffer.from(this.prevTxId, 'hex'),
            addressTypeBuf,
            addressIndexBuf,
            outpointIndexBuf,
        ]);
    }
    /**
     *
     * @param {string} signature
     */
    setSignature(signature) {
        this.signature = signature;
    }
    setSighash(sighash) {
        this.sighash = sighash;
    }
    toApiJSON() {
        return {
            previousOutpoint: {
                transactionId: this.prevTxId,
                index: this.outpointIndex,
            },
            signatureScript: this.signature ? `41${this.signature}01` : null,
            sequence: 0,
            sigOpCount: 1
        };
    }
}
export class TransactionOutput {
    constructor(outputData) {
        if (!outputData.value || outputData.value < 0 || outputData.value > 0xFFFFFFFFFFFFFFFF) {
            throw new Error('value must be set to a value greater than 0 and less than 0xFFFFFFFFFFFFFFFF');
        }
        this.value = outputData.value;
        // Only then do we care about the script public key
        this.scriptPublicKey = outputData.scriptPublicKey;
    }
    serialize() {
        const valueBuf = Buffer.from(new BN(this.value).toArray('BE', 8));
        return Buffer.concat([
            valueBuf,
            Buffer.from(this.scriptPublicKey, 'hex'),
        ]);
    }
    toApiJSON() {
        return {
            amount: this.value,
            scriptPublicKey: {
                version: 0,
                scriptPublicKey: this.scriptPublicKey,
            },
        };
    }
}
export default {
    Transaction,
    TransactionInput,
    TransactionOutput,
};
//# sourceMappingURL=transaction.js.map