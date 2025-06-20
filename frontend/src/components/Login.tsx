import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextInput, Button, Title } from "@mantine/core";
import { Wallet, SecretNetworkClient } from "secretjs";
import { BattleshipClient } from "../utils/BattleshipClient";
import { notifications } from "@mantine/notifications";

function Login({ setClient }: { setClient: (c: BattleshipClient) => void }) {
    const [mnemonic, setMnemonic] = useState(import.meta.env.VITE_MNEMONIC || "");
    const [contractAddress, setContractAddress] = useState(import.meta.env.VITE_CONTRACT_ADDRESS || "");
    const [codeHash, setCodeHash] = useState(import.meta.env.VITE_CONTRACT_HASH || "");
    const [chainId, setChainId] = useState(import.meta.env.VITE_CHAIN_ID || "");
    const [url, setUrl] = useState(import.meta.env.VITE_SECRET_REST_URL || "");
    const navigate = useNavigate();


    const handleLogin = async () => {
        try {
            const wallet = new Wallet(mnemonic);
            const secretjs = new SecretNetworkClient({
                chainId: chainId,
                url,
                wallet,
                walletAddress: wallet.address,
            });
            const client = new BattleshipClient(secretjs, contractAddress, codeHash, wallet);

            // Test query: try to get all game IDs
            await client.queryAllGameIds();

            setClient(client);
            navigate("/app");
        } catch (e) {
            notifications.show({
                title: "Login Failed",
                message: "Could not connect to contract. Please check your credentials.",
                color: "red",
                position: "top-left"
            });
        }
    };

    return (
        <Container size="xs" pt="xl">
            <Title ta="center" mb="md">Welcome to Battleships!</Title>
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
            <TextInput
                label="Url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                mb="md"
                placeholder="Enter Network Url"
            />
            <Button fullWidth onClick={handleLogin} disabled={!mnemonic || !contractAddress || !codeHash || !chainId}>
                Login
            </Button>
        </Container>
    );
}

export default Login;