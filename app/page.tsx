"use client";

import { useState } from 'react';
import { BASE_FEE, Networks, TransactionBuilder, scValToNative, SorobanRpc, xdr, Contract, Keypair } from '@stellar/stellar-sdk';
import { StellarWalletsKit, WalletNetwork, allowAllModules, XBULL_ID } from '@creit.tech/stellar-wallets-kit';
import { Client, ClientOptions, Spec } from '@stellar/stellar-sdk/contract';

//const rpc = new SorobanRpc.Server('https://stellar-mainnet.liquify.com/api=41EEWAH79Y5OCGI7/mainnet', { allowHttp: true });
const rpc = new SorobanRpc.Server('https://soroban-rpc.mainnet.stellar.gateway.fm', { allowHttp: true });
interface FunctionSpec {
  name: string;
  doc: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
}
function parseSpec(spec: Spec): FunctionSpec[] {
  return spec.funcs().map(fn => ({
    name: fn.name().toString(),
    doc: fn.doc().toString(),
    inputs: fn.inputs().map(input => ({
      name: input.name().toString(),
      type: input.type().switch().name
    })),
    outputs: fn.outputs().map(output => ({
      name: output.switch().name,
      type: output.switch().name
    }))
  }));
}

async function getSpec(contractId: string): Promise<Spec> {
  const clientOptions: ClientOptions = {
    contractId: contractId,
    networkPassphrase: Networks.PUBLIC,
    rpcUrl: rpc.serverURL
  };
  const wasmByteCode = await rpc.getContractWasmByContractId(contractId);
  const spec = (await Client.fromWasm(wasmByteCode, clientOptions)).spec;
  return spec;
}

async function getSimResult(func: any, publicKey: string): Promise<any> {
  const sourceAccount = await rpc.getAccount(publicKey);
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(func)
    .setTimeout(30)
    .build();

  const result = await rpc.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(result)) {
    throw new Error(`Simulation error: ${result.error}`);
  }
  return scValToNative(result.result?.retval as xdr.ScVal);
}

const Home = ({ searchParams }: { searchParams: { contractId?: string } }) => {
  const [contractId, setContractId] = useState<string>(searchParams.contractId || '');
  const [spec, setSpec] = useState<FunctionSpec[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: any }>({});
  const [secretKey, setSecretKey] = useState<string>('');
  const [publicKey, setPublicKey] = useState<string>('');
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);

  const loadSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fetchedSpec = await getSpec(contractId);
      const parsedSpec = await parseSpec(fetchedSpec);
      setSpec(parsedSpec);
      setError(null);
    } catch (err) {
      setError('Failed to load spec');
      setSpec(null);
    }
  };

  const handleRead = async (fn: FunctionSpec) => {
    try {
      const tokenContract = new Contract(contractId);
      const funcOperation = tokenContract.call(fn.name);
      
      const simResult = await getSimResult(funcOperation, publicKey);
      setResults((prevResults) => ({ ...prevResults, [fn.name]: simResult }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error reading function:', error);
        setError(`Error reading function: ${error.message}`);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleSecretKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keypair = Keypair.fromSecret(secretKey);
    setPublicKey(keypair.publicKey());
    setResults({});  // Clear results on new key submission
    setError(null);
  };

  const connectWallet = async () => {
    const walletKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: XBULL_ID,
      modules: allowAllModules(),
    });

    setKit(walletKit);

    await walletKit.openModal({
      onWalletSelected: async (option) => {
        walletKit.setWallet(option.id);
        const publicKey = await walletKit.getPublicKey();
        setPublicKey(publicKey);
        setResults({});  // Clear results on wallet connection
        setError(null);
      },
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <form onSubmit={loadSpec} style={{ marginBottom: '20px', maxWidth: '75%', margin: '0 auto', padding: '20px', backgroundColor: '#222', borderRadius: '10px' }}>
        <input
          type="text"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          placeholder="Enter contract address"
          required
          style={{ padding: '10px', fontSize: '16px', width: '500px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Load Spec</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ margin: '20px 0' }}>
        <button onClick={connectWallet} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Connect Wallet</button>
      </div>
      <form onSubmit={handleSecretKeySubmit} style={{ marginBottom: '20px', maxWidth: '75%', margin: '0 auto', padding: '20px', backgroundColor: '#222', borderRadius: '10px' }}>
        <input
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="Enter secret key"
          required
          style={{ padding: '10px', fontSize: '16px', width: '500px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Submit Secret Key</button>
      </form>
      {spec && (
        <div style={{ maxWidth: '75%', margin: '0 auto' }}>
          {spec.map((fn, index) => (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '20px',
              borderBottom: '1px solid #ccc',
              paddingBottom: '10px',
              backgroundColor: index % 2 === 0 ? '#333' : '#444',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: '1' }}>
                  <h3 style={{ margin: '10px 0' }}>{fn.name}</h3>
                  <p style={{ margin: '10px 0', fontStyle: 'italic' }}>{fn.doc}</p>
                </div>
                <div style={{ flex: '2' }}>
                  {fn.inputs.map((input, idx) => (
                    <div key={idx} style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>{input.name} ({input.type})</label>
                      <input
                        type="text"
                        name={input.name}
                        readOnly
                        style={{ padding: '10px', fontSize: '16px', width: '100%', borderRadius: '5px' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {fn.inputs.length === 0 ? (
                    <button onClick={() => handleRead(fn)} style={{
                      marginRight: '10px',
                      padding: '10px 20px',
                      fontSize: '16px',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}>Read</button>
                  ) : (
                    <>
                      <button style={{
                        marginRight: '10px',
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}>Simulate</button>
                      <button style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}>Invoke</button>
                    </>
                  )}
                </div>
              </div>
              {results[fn.name] && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#555', borderRadius: '5px' }}>
                  <p style={{ color: 'lightgreen' }}>Result: {JSON.stringify(results[fn.name])}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
