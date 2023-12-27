/// <reference types="node" />
type TransactionApiJSON = {
    transaction: {
        version: number;
        inputs: TransactionInputApiJSON[];
        outputs: TransactionOutputApiJSON[];
        lockTime: number;
        subnetworkId: string;
    };
};
export declare class Transaction {
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
    version: number;
    changeAddressType: number;
    changeAddressIndex: number;
    account: number;
    constructor(txData: {
        inputs: TransactionInput[];
        outputs: TransactionOutput[];
        version: number;
        changeAddressType?: number;
        changeAddressIndex?: number;
        account?: number;
    });
    serialize(): Buffer;
    /**
     * Convert this transaction to a JSON object that api.kaspa.org will accept
     */
    toApiJSON(): TransactionApiJSON;
}
type TransactionInputApiJSON = {
    previousOutpoint: {
        transactionId: string;
        index: number;
    };
    signatureScript: string | null;
    sequence: number;
    sigOpCount: number;
};
export declare class TransactionInput {
    signature?: string | null;
    sighash?: string | null;
    value: number;
    prevTxId: string;
    outpointIndex: number;
    addressType: number;
    addressIndex: number;
    constructor(inputData: {
        value: number;
        prevTxId: string;
        outpointIndex: number;
        addressType: number;
        addressIndex: number;
    });
    serialize(): Buffer;
    /**
     *
     * @param {string} signature
     */
    setSignature(signature: string): void;
    setSighash(sighash: string): void;
    toApiJSON(): TransactionInputApiJSON;
}
type TransactionOutputApiJSON = {
    amount: number;
    scriptPublicKey: {
        version: number;
        scriptPublicKey: string;
    };
};
export declare class TransactionOutput {
    value: number;
    scriptPublicKey: string;
    constructor(outputData: {
        value: number;
        scriptPublicKey: string;
    });
    serialize(): Buffer;
    toApiJSON(): TransactionOutputApiJSON;
}
declare const _default: {
    Transaction: typeof Transaction;
    TransactionInput: typeof TransactionInput;
    TransactionOutput: typeof TransactionOutput;
};
export default _default;
//# sourceMappingURL=transaction.d.ts.map