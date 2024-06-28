// utils/getSpec.ts
import { Client, ClientOptions, Spec} from '@stellar/stellar-sdk/contract';
import { Networks } from '@stellar/stellar-sdk';

import { config } from './env_config';



interface FunctionSpec {
  name: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
}

export async function getSpec(contractId: string): Promise<Spec> {
  const clientOptions: ClientOptions = {
    contractId: contractId,
    networkPassphrase: Networks.PUBLIC,
    rpcUrl: config.rpc.serverURL
  };
  const wasmByteCode = await config.rpc.getContractWasmByContractId(contractId);
  const spec = (await Client.fromWasm(wasmByteCode, clientOptions)).spec;
  return spec;
}
