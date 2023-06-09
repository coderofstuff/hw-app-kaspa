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

        this.changeAddressType = Number.isInteger(txData.changeAddressType) ? txData.changeAddressType : 0;
        this.changeAddressIndex = Number.isInteger(txData.changeAddressIndex) ? txData.changeAddressIndex : 0;

        if (!(this.changeAddressType === 0 || this.changeAddressType === 1)) {
            throw new Error(`changeAddressType must be 0 or 1 if set`);
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
        changeAddressTypeBuf.writeUInt8(this.changeAddressType || 0);

        const changeAddressIndexBuf = Buffer.alloc(4);
        changeAddressIndexBuf.writeUInt32BE(this.changeAddressIndex || 0);

        return Buffer.concat([
            versionBuf,
            outputLenBuf,
            inputLenBuf,
            changeAddressTypeBuf,
            changeAddressIndexBuf,
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

    /**
     * @type {str}
     */
    sighash;

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

class TransactionOutput {
    constructor(outputData = {}) {
        if (!outputData.value || outputData.value < 0 || outputData.value > 0xFFFFFFFFFFFFFFFF) {
            throw new Error('value must be set to a value greater than 0 and less than 0xFFFFFFFFFFFFFFFF');
        }
        this.value = outputData.value;
        if (!outputData.scriptPublicKey) {
            throw new Error('scriptPublicKey must be set');
        }

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

module.exports = {
    Transaction,
    TransactionInput,
    TransactionOutput,
};
