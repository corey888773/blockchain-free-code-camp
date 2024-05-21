import { ethers } from "./ethers-5.2.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById('connectButton');
const fundButton = document.getElementById('fundButton');

connectButton.addEventListener('click', connect);
fundButton.addEventListener('click', fund);

async function connect() {
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.request({ method: 'eth_requestAccounts' })
        connectButton.innerHTML = 'Connected';
    } else {
        console.log('Please install MetaMask!');
        connectButton.innerHTML = 'MetaMask not installed';
    }
}

async function fund() {
    const ethAmount = "0.1"
    if (typeof window.ethereum !== 'undefined') {
        console.log(`Funding ${ethAmount} ETH`);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try {
            const tx = await contract.fund({ value: ethers.utils.parseEther(ethAmount) });
            await listenForTransactionMine(tx, provider)
            console.log('Funded!');
        } catch (err) {
            console.log(err);
        }
    }
}

function listenForTransactionMine(tx, provider) {
    console.log(`Listening for transaction mine ${tx.hash}`);
    return new Promise((resolve, reject) => {
        provider.once(tx.hash, (receipt) => {
            console.log(`Completed with ${receipt.confirmations} confirmations`);

            resolve();
        });
    })
}