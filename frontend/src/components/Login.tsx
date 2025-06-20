import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextInput, Button, Title } from "@mantine/core";
import { Wallet, SecretNetworkClient } from "secretjs";
import { BattleshipClient } from "../utils/BattleshipClient";

function Login({ setClient }: { setClient: (c: BattleshipClient) => void }) {
    const [mnemonic, setMnemonic] = useState(import.meta.env.VITE_MNEMONIC || "");
    const [contractAddress, setContractAddress] = useState(import.meta.env.VITE_CONTRACT_ADDRESS || "");
    const [codeHash, setCodeHash] = useState(import.meta.env.VITE_CONTRACT_HASH || "");
    const [chainId, setChainId] = useState(import.meta.env.VITE_CHAIN_ID || "");
    const navigate = useNavigate();

    const handleLogin = () => {
        const wallet = new Wallet(mnemonic);
        const secretjs = new SecretNetworkClient({
            chainId: chainId, // or get from input/env
            url: "/api",
            wallet,
            walletAddress: wallet.address,
        });
        const client = new BattleshipClient(secretjs, contractAddress, codeHash, wallet);
        setClient(client);
        navigate("/app");
    };

    return (
        <Container size="xs" pt="xl">
            <Title ta="center" mb="md">Welcome to Battleship!</Title>
            <TextInput
                label="Mnemonic"
                value={mnemonic}
                onChange={e => setMnemonic(e.target.value)}
                mb="sm"
                placeholder="Enter your wallet mnemonic"
            />
            <TextInput
                label="Contract Address"
                value={contractAddress}
                onChange={e => setContractAddress(e.target.value)}
                mb="sm"
                placeholder="Enter contract address"
            />
            <TextInput
                label="Code Hash"
                value={codeHash}
                onChange={e => setCodeHash(e.target.value)}
                mb="md"
                placeholder="Enter contract code hash"
            />
            <TextInput
                label="Chain Id"
                value={chainId}
                onChange={e => setChainId(e.target.value)}
                mb="md"
                placeholder="Enter chain Id"
            />
            <Button fullWidth onClick={handleLogin} disabled={!mnemonic || !contractAddress || !codeHash || !chainId}>
                Login
            </Button>
        </Container>
    );
}

export default Login;