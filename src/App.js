import React, { useState, useEffect } from "react";

/* ERC71 based Solidity Contract Interface */
import ethTheTribeNFT from "./utils/ETHTheTribeNFT.json";

/* NFT.Storage import for creating an IPFS CID & storing with Filecoin */
import { NFTStorage, File } from "nft.storage";
import { cardheadSVG, cardimageSVG, cardrow1SVG, cardrow2SVG, cardrow3SVG, cardfooterSVG} from "./utils/BaseSVG";

/* Javascript Lib for evm-compatible blockchain contracts */
import { ethers } from "ethers";

/* UI Components & Style*/
import "./styles/App.css";
import Layout from "./components/Layout";
import MintNFTInput from "./components/MintNFTInput";
import Status from "./components/Status";
import ImagePreview from "./components/ImagePreview";
import Link from "./components/Link";
import DisplayLinks from "./components/DisplayLinks";
import ConnectWalletButton from "./components/ConnectWalletButton";
import NFTViewer from "./components/NFTViewer";

/* Namehash Utility - Thanks to raffy.eth*/
import {keccak, hex_from_bytes} from '@adraffy/keccak';
function namehash(name) {
  let buf = new Uint8Array(64); 
  if (name.length > 0) {
    for (let label of name.split('.').reverse()) {
      buf.set(keccak().update(label).bytes, 32);
      buf.set(keccak().update(buf).bytes, 0);
    }
  }
  return buf.slice(0, 32);
}

const INITIAL_LINK_STATE = {
  etherscan: "",
  opensea: "",
  rarible: "",
};

const INITIAL_TRANSACTION_STATE = {
  loading: "",
  error: "",
  success: "",
  warning: "",
};

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [nameHash, setNameHash] = useState("");
  const [linksObj, setLinksObj] = useState(INITIAL_LINK_STATE);
  const [imageView, setImageView] = useState("");
  const [tokenStatus, setTokenStatus] = useState("");
  const [nftTokenStatus, setNFTTokenStatus] = useState("");
  const [miningStatus, setMiningStatus] = useState("");
  const [remainingNFTs, setRemainingNFTs] = useState("");
  const [nftCollectionData, setNftCollectionData] = useState("");
  const [recentlyMinted, setRecentlyMinted] = useState("");
  const [transactionState, setTransactionState] = useState(
    INITIAL_TRANSACTION_STATE
  );
  const { loading, error, success } = transactionState; //make it easier

  /* runs on page load - checks wallet is connected */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  /* If a wallet is connected, do some setup */
  useEffect(() => {
    setUpEventListener();
    fetchNFTCollection();
  }, [currentAccount]);

  /* Check for a wallet */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure Metamask is installed and active!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
      setUpEventListener();
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      setCurrentAccount(accounts[0]);

        /* ENS Resolution
        const provider = new ethers.providers.Web3Provider(ethereum);
        console.log(await provider.lookupAddress("0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5"));*/

        // Dynamic: "+accounts[0]+"
        // Testing Address: 0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5
        fetch("https://api.etherscan.io/api?module=account&action=tokentx&address="+accounts[0]+"&startblock=0&endblock=999999999&sort=asc&apikey=BBXM93VY2U2Y7WAPT6X53IBVFCWXWXUBF4")
        .then(response => response.json())
        .then(data => {
          let tokenStatus = data["status"];
          console.log(tokenStatus)

          if (tokenStatus == 1) {
              let tokenStatus = "Token Trader";
              setTokenStatus(
                tokenStatus
              );
              console.log(
                "Token Status Set",
                tokenStatus
              )
          } else {
              let tokenStatus = "ETH Maxi";
              setTokenStatus(
                tokenStatus
              );
              console.log(
                "Token Status Set",
                tokenStatus
              )
          }
        });

        fetch("https://api.etherscan.io/api?module=account&action=tokennfttx&address="+accounts[0]+"&startblock=0&endblock=999999999&sort=asc&apikey=BBXM93VY2U2Y7WAPT6X53IBVFCWXWXUBF4")
        .then(response => response.json())
        .then(data => {
          let nftTokenStatus = data["status"];
          console.log(tokenStatus)

          if (nftTokenStatus == 1) {
              let nftTokenStatus = "NFT Collector";
              setNFTTokenStatus(
                nftTokenStatus
              );
              console.log(
                "Token Status Set",
                nftTokenStatus
              )
          } else {
              let nftTokenStatus = "My First NFT";
              setNFTTokenStatus(
                nftTokenStatus
              );
              console.log(
                "Token Status Set",
                nftTokenStatus
              )
          }
        });

        // Testing Address: 0x9dd134d14d1e65f84b706d6f205cd5b1cd03a46b
        fetch("https://api.etherscan.io/api?module=account&action=getminedblocks&address="+accounts[0]+"&blocktype=blocks&apikey=BBXM93VY2U2Y7WAPT6X53IBVFCWXWXUBF4")
        .then(response => response.json())
        .then(data => {
          let miningStatus = data["status"];
          console.log(miningStatus)

          if (miningStatus == 1) {
              let miningStatus = "ETH Miner";
              setMiningStatus(
                miningStatus
              );
              console.log(
                "Mining Status Set",
                miningStatus
              )
          } else {
              let miningStatus = "Blockless";
              setMiningStatus(
                miningStatus
              );
              console.log(
                "Mining Status Set",
                miningStatus
              )
          }
        });

    } else {
      console.log("No authorized account found");
    }

    //TODO: make sure on right network or change programatically
    // let chainId = await ethereum.request({ method: 'eth_chainId' });
    // console.log("Connected to chain " + chainId);

    // // String, hex code of the chainId of the Rinkebey test network
    // const rinkebyChainId = "0x4";
    // if (chainId !== rinkebyChainId) {
    //   alert("You are not connected to the Rinkeby Test Network!");
    // }
  };



  /* Connect a wallet */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Please install MetaMask from metamask.io");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

    } catch (error) {
      console.log(error);
    }
  };

  /* Listens for events emitted from the solidity contract, to render data accurately */
  const setUpEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ethTheTribeNFT.abi,
          signer
        );

        connectedContract.on("RemainingMintableNFTChange", (remainingNFTs) => {
          setRemainingNFTs(remainingNFTs);
        });
        connectedContract.on(
          "NewFilecoinNFTMinted",
          (sender, tokenId, tokenURI) => {
            console.log("event - new minted NFT");
            fetchNFTCollection();
          }
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* Helper function for createNFTData */
  const resetState = () => {
    setLinksObj(INITIAL_LINK_STATE);
    setName("");
    setImageView("");
    setTokenStatus("");
    setNFTTokenStatus("");
    setMiningStatus("");
  }

  /* Helper function for createNFTData */
  const createImageView = (metadata) => {
    let imgViewArray = metadata.data.image.pathname.split("/");
    let imgViewString = `https://${imgViewArray[2]}.ipfs.dweb.link/${imgViewArray[3]}`;
    setImageView(
      imgViewString
    );
    console.log(
      "image view set",
      `https://${imgViewArray[2]}.ipfs.dweb.link/${imgViewArray[3]}`
    );
  } 

  /* Create the IPFS CID of the json data */
  const createNFTData = async () => {
    console.log("saving to NFT storage");
    resetState();
    setTransactionState({
      ...INITIAL_TRANSACTION_STATE,
      loading: "Saving NFT data to NFT.Storage...",
    });

    // install it
    // Set Up the NFT.Storage Client
    const client = new NFTStorage({
      token: process.env.REACT_APP_NFT_STORAGE_API_KEY,
    });

    /* TODO: Work out how to get ENS Namehash for dynamic image geneation. It works with unnamed version but not named version. 
    const nameHash1 = namehash(``);
    const nameHash2 = namehash(`eth`);
    const nameHash3 = namehash(`nick`);
    const nameHash = namehash("nick.eth");
    console.log(hex_from_bytes(nameHash));
    
    */

    //lets load up this token with some metadata and our image and save it to NFT.storage
    //image contains any File or Blob you want to save
    //name, image, description, other traits.
    // useBlob to save one item to IPFS
    // use File to save all the json metadata needed - much like any object storage you're familiar with!
    try {
      await client
        .store({
          name: `${name} - Tribe Card`,
          description:
            "Ethereum: The Tribe, is an NFT collection highlighting players and their realms in the Ethereum Ecosystem.",
          image: new File(
            [
              `${cardheadSVG}<image x="226.8" y="99.6" width="631" height="631" xlink:href="https://metadata.ens.domains/mainnet/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85/98054760162215087821601516533704482139160916141216464909584436099751031713776/image" />
        ${cardimageSVG}${tokenStatus}${cardrow1SVG}${nftTokenStatus}${cardrow2SVG}${miningStatus}${cardrow3SVG}`+currentAccount+`${cardfooterSVG}`,
            ],
            `ETHTheTribe.svg`,
            {
              type: "image/svg+xml",
            }
          ),
          "attributes":[
            {
              "trait_type":"NFT",
              "value": `${tokenStatus}`,
            },
            {
              "trait_type":"Token Type",
              "value":`${nftTokenStatus}`,
            },
            {
              "trait_type":"Miner",
              "value":"No"
            }
          ],
        })
        .then((metadata) => {
          setTransactionState({
            ...transactionState,
            success: "Saved NFT data to NFT.Storage...!! We created an IPFS CID & made a Filecoin Storage Deal with one call!",
            loading: "",
          });
          console.log("metadata saved", metadata);

          // To view the data we just saved in the browser we need to use an IPFS http bridge
          // Or Brave Browser which has IPFS integration built into it
          // Or run a local IPFS node (there's a desktop app)
          // This means manipulating the returned CID to configure it for a gateway...
          // Check gateways & their functionality here: https://ipfs.github.io/public-gateway-checker/
          createImageView(metadata);
          
          //we can also check the status of our data using this
          // const status = await client.status(metadata.ipnft);
          // console.log("status", status);

          // Now that we have a CID and our data is stored on Filecoin, 
          // - we'll mint the NFT with the token data (and IPFS CID)
          askContractToMintNft(metadata.url);
        });
    } catch (error) {
      console.log("Could not save NFT to NFT.Storage - Aborted minting");
      setTransactionState({
        ...INITIAL_TRANSACTION_STATE,
        error: "Could not save NFT to NFT.Storage - Aborted minting",
      });
    }
  };

  /* Mint the NFT on the eth blockchain */
  const askContractToMintNft = async (IPFSurl) => {
    //should check the wallet chain is correct here
    setTransactionState({
      ...INITIAL_TRANSACTION_STATE,
      loading: "Approving & minting NFT...",
    });

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ethTheTribeNFT.abi,
          signer
        );

        console.log("Opening wallet");
        let nftTxn = await connectedContract.mintMyNFT(IPFSurl);

        connectedContract.on(
          "NewFilecoinNFTMinted",
          (from, tokenId, tokenURI) => {
            console.log("event listener", from, tokenId.toNumber(), tokenURI);
            setLinksObj({
              ...linksObj,
              opensea: `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`,
              rarible: `https://rinkeby.rarible.com/token/${CONTRACT_ADDRESS}:${tokenId.toNumber()}`,
              etherscan: `https://goerli.etherscan.io/tx/${nftTxn.hash}`,
            });
          }
        );

        //SHOULD UPDATE IMAGELINK to returned value
        await nftTxn.wait();
        setTransactionState({
          ...INITIAL_TRANSACTION_STATE,
          success: "NFT Minted!",
        });
      } else {
        console.log("Ethereum object doesn't exist!");
        setTransactionState({
          ...INITIAL_TRANSACTION_STATE,
          error: `No Wallet connected`,
        });
      }
    } catch (error) {
      setTransactionState({
        ...INITIAL_TRANSACTION_STATE,
        error: `Error Minting NFT. ${error.message}`,
      });
    }
  };

  /* Helper function - manipulating the returned CID into a http link using IPFS gateway */
  const createIPFSgatewayLink = (el) => {
    let link = el[1].split("/");
    let fetchURL = `https://${link[2]}.ipfs.dweb.link/${link[3]}`;
    return fetchURL;
  }

  /* 
    Helper function for fetching the Filecoin data through IPFS gateways 
    to display the images in the UI 
  */
  const createImageURLsForRetrieval = async (collection) => {
    let dataCollection = collection
    .slice()
    .reverse()
    .slice(0, 5)
    .map((el) => {
      return el;
    });

    let imgURLs = await Promise.all(
      dataCollection.map(async (el) => {
        const ipfsGatewayLink = createIPFSgatewayLink(el);
        // let link = el[1].split("/");
        // let fetchURL = `https://${link[2]}.ipfs.dweb.link/${link[3]}`;
        console.log("fetchURL", ipfsGatewayLink);
        const response = await fetch(ipfsGatewayLink, 
      //     {
      //     method : "GET",
      //     mode: 'cors',
      //     type: 'cors',
      //     headers: {}
      // }
      );
        const json = await response.json();
        // console.log("Responsejson", json)
        return json;
      })
    );

    console.log("imgURLs2", imgURLs);
    setRecentlyMinted(imgURLs);
  }

 /* Function to get our collection Data from
    1. The blockchain
    2. Filecoin via IPFS addressing & http gateways
 */
  const fetchNFTCollection = async () => {
    console.log("fetching nft collection");
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ethTheTribeNFT.abi,
          signer
        );

        let remainingNFTs = await connectedContract.remainingMintableNFTs();
        setRemainingNFTs(remainingNFTs.toNumber()); //update state

        let collection = await connectedContract.getNFTCollection();
        setNftCollectionData(collection); //update state
        console.log("collection", collection);

        /***
         * Going to put these in the view collection
         */
        await createImageURLsForRetrieval(collection);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };


  /* Render our page */
  return (
    <Layout connected={currentAccount === ""} connectWallet={connectWallet}>
      <>
        {transactionState !== INITIAL_TRANSACTION_STATE && <Status transactionState={transactionState}/>}
        {imageView &&
          !linksObj.etherscan && <Link link={imageView} description="See IPFS image link"/>}
        {imageView && <ImagePreview imgLink ={imageView}/>}
        {linksObj.etherscan && <DisplayLinks linksObj={linksObj} />}
        {currentAccount === "" ? (
          <ConnectWalletButton connectWallet={connectWallet}/>
        ) : transactionState.loading ? (
          <div />
        ) : (
          <MintNFTInput name={name} setName={setName} transactionState={transactionState} createNFTData={createNFTData}/>
        )}
        {recentlyMinted && <NFTViewer recentlyMinted={recentlyMinted}/>}
      </>
    </Layout>
  );
};

export default App;
