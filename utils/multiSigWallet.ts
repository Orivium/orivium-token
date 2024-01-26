const multiSigWallets = {
    sepolia: "0xe74498b357b549BaBdcAB63316faD14898cB2535",
    goerli: "0xc84A537E76CaB34221F1e71994b4156933fB0Ae0",
    mainnet: "0x67C658440728c3afEcC036D81aAa2d30C98Fd444",
    arbitrum: "0x47aD8BeD4E50C16B9E1205507124a2E80E38668b",
    hardhat: null,
};

const isSupportedNetwork = (network: string): network is keyof typeof multiSigWallets => {
    return network in multiSigWallets;
};

export {
    multiSigWallets,
    isSupportedNetwork,
};
