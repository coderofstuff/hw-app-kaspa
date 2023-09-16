const {
    openTransportReplayer,
    RecordStore,
} = require("@ledgerhq/hw-transport-mocker");
const Kaspa = require("../src/kaspa");
const { TransactionInput, TransactionOutput, Transaction } = require("../src/transaction");

describe("kaspa", () => {
    it("getVersion", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                  => e004000000
                  <= 0105069000
              `)
        );
        const kaspa = new Kaspa(transport);
        const result = await kaspa.getVersion();
        expect(result).toEqual({
            version: "1.5.6"
        });
    });
    
    it("getAddress without display", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                  => e005000015058000002c8001b207800000000000000000000000
                  <= deadbeef9000
              `)
        );
        const kaspa = new Kaspa(transport);
        const { address } = await kaspa.getAddress("44'/111111'/0'/0/0", false);
        expect(address.toString("hex")).toEqual("deadbeef");
    });
    
    it("getAddress with display", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                  => e005010015058000002c8001b207800000000000000000000000
                  <= deadbeef9000
              `)
        );
        const kaspa = new Kaspa(transport);
        const { address } = await kaspa.getAddress("44'/111111'/0'/0/0", true);
        expect(address.toString("hex")).toEqual("deadbeef");
    });

    it("signTransaction with simple data", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e006008009000001010102030405
                <= 9000
                => e00601802a000000000010a1d02011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac
                <= 9000
                => e00602002e000000000010c8e040b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70000000000000
                <= 000040ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a32000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff9000
            `)
        );
        const kaspa = new Kaspa(transport);

        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405,
        });

        await kaspa.signTransaction(tx);
        expect(txin.signature).toEqual("ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3");
        expect(txin.sighash).toEqual("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");
    });

    it("signMessage with simple data", async () => {
        const expectedSignature = 'ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3';
        const expectedMessageHash = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00700001200000000000c48656c6c6f204b6173706121
                <= 40${expectedSignature}20${expectedMessageHash}9000
            `)
        );
        const kaspa = new Kaspa(transport);

        try {
            const { signature, messageHash } = await kaspa.signMessage('Hello Kaspa!', 0, 0);
            expect(signature).toEqual(expectedSignature);
            expect(messageHash).toEqual(messageHash);
        } catch (e) {
            console.error(e);
            expect(e).toBe(null);
        }
    });
});

describe("Transaction", () => {
    it("should serialize", () => {
        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405
        });

        const expectation = Buffer.from([0x00, 0x00, 0x01, 0x01, 0x01, 0x02, 0x03, 0x04, 0x05]);

        expect(tx.serialize().equals(expectation)).toBeTruthy();
    });
});

describe("TransactionOutput", () => {
    it("should throw no error if only scriptPublicKey and value is set", () => {
        let err = null;
        try {
            new TransactionOutput({
                value: 1090000,
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });
        } catch (e) {
            err = e;
        }

        expect(err).toBe(null);
    });

    it("should serialize value and scriptPublicKey", () => {
        const serial = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        }).serialize();

        const expectation = Buffer.from([
            0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0xa1, 0xd0,
            0x20, 0x11, 0xa7, 0x21, 0x5f, 0x66, 0x8e, 0x92,
            0x10, 0x13, 0xeb, 0x7a, 0xac, 0x9b, 0x7e, 0x64,
            0xb9, 0xec, 0x6e, 0x75, 0x7c, 0x1b, 0x64, 0x8e,
            0x89, 0x38, 0x8c, 0x91, 0x9f, 0x67, 0x6a, 0xa8,
            0x8c, 0xac,
        ]);
        
        expect(serial.equals(expectation)).toBeTruthy();
    });

    it("should throw errors if none of scriptPublicKey or (addressType, addressIndex) are set", () => {
        let err = null;
        try {
            new TransactionOutput({
                value: 1090000
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("should throw errors if value is not set", () => {
        let err = null;
        try {
            new TransactionOutput({
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("should throw errors if value is < 0 or > 0xFFFFFFFFFFFFFFFF", () => {
        let err = null;
        try {
            new TransactionOutput({
                value: 0,
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);

        try {
            new TransactionOutput({
                value: 0xFFFFFFFFFFFFFFFF + 1,
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });
});
