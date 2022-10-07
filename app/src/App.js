import './App.css';
import { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import idl from './idl.json';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

window.Buffer = window.Buffer || require("buffer").Buffer;

const wallets = [new PhantomWalletAdapter()];
const { SystemProgram, Keypair } = web3;
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
};
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

const App = () => {
  const [value, setValue] = useState('');
  const [dataList, setDataList] = useState([]);
  const [input, setInput] = useState('');
  const wallet = useWallet();

  const getProvider = async () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, wallet, opts.preflightCommitment);
    return provider;
  }

  const initialize = async () => {
    const provider = await getProvider();

    const program = new Program(idl, programID, provider);
    try {
      await program.methods
        .initialize("Hello world")
        .accounts({
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([baseAccount])
        .rpc();
      
      console.log("2");
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log("account: ", account);
      setValue(account.data.toString())
      setDataList(account.dataList);
    } catch (err) {
      console.log("error: ", err);
    }
  }

  const update = async () => {
    if (!input) return;

    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    await program.methods
      .update(input)
      .accounts({
        baseAccount: baseAccount.publicKey,
      })
      .rpc();

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log("account: ", account);
    setValue(account.data.toString());
    setDataList(account.dataList);
    setInput('');
  }

  if (!wallet.connected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <WalletMultiButton />
      </div>
    );
  } else {
    return (
      <div className='App'>
        <div>
          {
            !value && (<button onClick={initialize}>Initialize</button>)
          }
          {
            value ? (
              <div>
                <h2> Current value: {value}</h2>
                <input
                  placeholder='Add new data'
                  onChange={(e) => setInput(e.target.value)}
                  value={input} />
                <button onClick={update}>Add data</button>
              </div>
            ) : (
              <h3>Please initialize</h3>
            )
          }
          {
            dataList.map((item, index) => <h4 key={index}>{item}</h4>)
          }
        </div>
      </div>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;