const BN = require("bn.js");

class Transaction {
    constructor(txData = {}) {
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
    }

    serialize() {
        const versionBuf = Buffer.alloc(2);
        versionBuf.writeUInt16BE(this.version);

        const outputLenBuf = Buffer.alloc(1);
        outputLenBuf.writeUInt8(this.outputs.length);

        const inputLenBuf = Buffer.alloc(1);
        inputLenBuf.writeUInt8(this.inputs.length);

        return Buffer.concat([
            versionBuf,
            outputLenBuf,
            inputLenBuf,
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

class TransactionInput {
    /**
     * @type {str}
     */
    signature;

    constructor(inputData = {}) {
        this.value = inputData.value;
        this.prevTxId = inputData.prevTxId;
        this.outpointIndex = inputData.outpointIndex;
        this.addressType = inputData.addressType;
        this.addressIndex = inputData.addressIndex;
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

    toApiJSON() {
        return {
            previousOutpoint: {
                transactionId: this.prevTxId,
                index: this.outpointIndex,
            },
            signatureScript: `41${this.signature}01`,
            sequence: 0,
            sigOpCount: 1
        };
    }
}

class TransactionOutput {
    constructor(outputData = {}) {
        this.value = outputData.value;
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

module.exports = {
    Transaction,
    TransactionInput,
    TransactionOutput,
};
