import { Keypair, SorobanRpc } from '@stellar/stellar-sdk';
// Import the necessary modules
import * as dotenv from 'dotenv';
import * as path from 'path';

// Configure dotenv to load the .env file from the correct location
dotenv.config({ path: path.join(__dirname, '../.env') });

class EnvConfig {
    rpc: SorobanRpc.Server;
    passphrase: string;
    stellar_keypair: Keypair;

    constructor(
      rpc: SorobanRpc.Server,
      passphrase: string,

      stellar_keypair: Keypair
    ) {
      this.rpc = rpc;
      this.passphrase = passphrase;
      this.stellar_keypair = stellar_keypair;
    }
  
    
    /**
     * Load the environment config from the .env file
     * @returns Environment config
     */
    static loadFromFile(): EnvConfig {
      const rpc_url = process.env.RPC_URL;
      const passphrase = process.env.NETWORK_PASSPHRASE;
      const stellar_keypair = process.env.STELLAR_SECRET_KEY;
      if (

        rpc_url == undefined ||
        passphrase == undefined ||
  
        stellar_keypair == undefined
      ) {
        throw new Error('Error: .env file is missing required fields');
      }
  
      return new EnvConfig(
        new SorobanRpc.Server(rpc_url, { allowHttp: true }),
        passphrase,
     
        Keypair.fromSecret(stellar_keypair)
      );
    }
  }
  
  export const config = EnvConfig.loadFromFile();
  