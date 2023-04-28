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
                => e00600800400000101
                <= 9000
                => e00601802a000000000010a1d02011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac
                <= 9000
                => e00602002e000000000010c8e040b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70000000000000
                <= 000040ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a39000
            `)
        );
        const kaspa = new Kaspa(transport);

        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
        });

        await kaspa.signTransaction(tx);
        expect(txin.signature).toEqual("ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3");
    });
});
