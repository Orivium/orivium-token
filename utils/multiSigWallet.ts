const multiSigWallets = {
    sepolia: "0xe74498b357b549BaBdcAB63316faD14898cB2535",
    goerli: "0xc84A537E76CaB34221F1e71994b4156933fB0Ae0",
    mainnet: "0x07033A2928194010F8A03fB3fb1e9Cec01897E78",
    arbitrum: "0x103B77FB36f891f90D6E0c8d43Ca72f2858dDd55",
    hardhat: null,
};

const isSupportedNetwork = (network: string): network is keyof typeof multiSigWallets => {
    return network in multiSigWallets;
};

export {
    multiSigWallets,
    isSupportedNetwork,
};
