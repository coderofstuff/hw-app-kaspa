const Transport = require("@ledgerhq/hw-transport").default;

const { StatusCodes } = require("@ledgerhq/errors");

const BIP32Path = require("bip32-path");

const {Transaction} = require('./transaction');

// Get Address
const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

// Sign Transaction
const P1_HEADER = 0x00;
const P1_OUTPUTS = 0x01;
const P1_INPUTS = 0x02;
const P1_NEXT_SIGNATURE = 0x03;

const P2_LAST = 0x00;
const P2_MORE = 0x80;

const MAX_PAYLOAD = 255;

const LEDGER_CLA = 0xe0;

const INS = {
    GET_VERSION: 0x04,
    GET_ADDRESS: 0x05,
    SIGN_TX: 0x06,
};

function pathToBuffer(originalPath) {
    const pathNums = BIP32Path.fromString(originalPath).toPathArray();
    return serializePath(pathNums);
}

function serializePath(path) {
    const buf = Buffer.alloc(1 + path.length * 4);
    buf.writeUInt8(path.length, 0);
    for (const [i, num] of path.entries()) {
        buf.writeUInt32BE(num, 1 + i * 4);
    }
    return buf;
}

class Kaspa {
    /**
     * @type {Transport}
     */
    transport = null;

    constructor(transport) {
        if (!(transport instanceof Transport)) {
            throw new Error("transport must be an instance of @ledgerhq/hw-transport");
        }
        this.transport = transport;
        this.transport.decorateAppAPIMethods(this, [
            "getVersion",
            "getAddress",
            "signTransaction",
        ]);
    }

    /**
     * Get Kaspa address (public key) for a BIP32 path.
     *
     * @param {string} path a BIP32 path
     * @param {boolean} display flag to show display
     * @returns {Buffer} an object with the address field
     *
     * @example
     * kaspa.getAddress("44'/111111'/0'").then(r => r.address)
     */
    async getAddress(path, display) {
        const pathBuffer = pathToBuffer(path);

        const p1 = display ? P1_CONFIRM : P1_NON_CONFIRM;

        const addressBuffer = await this.sendToDevice(INS.GET_ADDRESS, p1, pathBuffer);

        return {
            address: addressBuffer,
        };
    }

    /**
     * Sign a Kaspa transaction. Applies the signatures into the input objects
     *
     * @param {Transaction} transaction - the Transaction object
     *
     *
     * @example
     * kaspa.signTransaction(transaction).then(r => r.signature)
     */
    async signTransaction(transaction) {
        if (!(transaction instanceof Transaction)) {
            throw new Error("transaction must be an instance of Transaction");
        }
        // Ledger app supports only a single derivation path per call ATM
        const pathsCountBuffer = Buffer.alloc(1);
        pathsCountBuffer.writeUInt8(1, 0);

        const header = transaction.serialize();

        await this.sendToDevice(INS.SIGN_TX, P1_HEADER, header, P2_MORE);

        for (const output of transaction.outputs) {
            await this.sendToDevice(INS.SIGN_TX, P1_OUTPUTS, output.serialize(), P2_MORE);
        }

        let signatureBuffer = null;

        for (let i = 0; i < transaction.inputs.length; i++) {
            let p2 = i >= transaction.inputs.length - 1 ? P2_LAST : P2_MORE;
            const input = transaction.inputs[i];
            signatureBuffer = await this.sendToDevice(INS.SIGN_TX, P1_INPUTS, input.serialize(), p2);
        }

        const signatures = [];

        while (signatureBuffer) {
            const [hasMore, inputIndex, sigLen, ...sigBuf] = signatureBuffer;

            if (sigLen != 64) {
                throw new Error(`Expected signature length is 64. Received ${sigLen} for input ${inputIndex}`);
            }

            transaction.inputs[inputIndex].setSignature(Buffer(sigBuf).toString("hex"));

            // Keep going as long as hasMore is true-ish
            if (!hasMore) {
                break;
            }

            signatureBuffer = await this.sendToDevice(INS.SIGN_TX, P1_NEXT_SIGNATURE);
        }
    }

    /**
     * Get application configuration.
     *
     * @returns {Buffer} application config object
     *
     * @example
     * kaspa.getVersion().then(r => r.version)
     */
    async getVersion() {
        const [major, minor, patch] = await this.sendToDevice(INS.GET_VERSION, P1_NON_CONFIRM);

        return { version: `${major}.${minor}.${patch}` };
    }
    
    async sendToDevice(instruction, p1, payload = Buffer.alloc(0), p2 = P2_LAST) {
        const acceptStatusList = [StatusCodes.OK];

        const reply = await this.transport.send(
            LEDGER_CLA,
            instruction,
            p1,
            p2,
            payload,
            acceptStatusList
        );
    
        return reply.subarray(0, reply.length - 2);
    }
}

module.exports = Kaspa;
