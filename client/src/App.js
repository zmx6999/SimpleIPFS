import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
import "./App.css";
const ipfsAPI=require("ipfs-api")
const ipfs=ipfsAPI("127.0.0.1",5001,{protocol:"http"})

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(SimpleStorageContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

    saveToIpfs=async reader => new Promise(async (resolve, reject) => {
        try {
            let r=await ipfs.add(Buffer.from(reader.result))
            resolve(r[0].hash)
        } catch (e) {
            reject(e)
        }
    })

    upload=info => {
        let reader=new FileReader()
        reader.readAsArrayBuffer(info)
        reader.onloadend=async () => {
            let hash=await this.saveToIpfs(reader)
            this.setState({hash})
        }
    }

    saveHashToEth=async () => {
        const {web3,hash,contract}=this.state
        try {
            let accounts=await web3.eth.getAccounts()
            await contract.set(hash,{from:accounts[0]})
            this.setState({isWriteOK:true})
        } catch (e) {
            this.setState({isWriteOK:false})
        }
    }

    getHash=async () => {
        const {contract}=this.state
        try {
            let response=await contract.get.call()
            this.setState({response})
        } catch (e) {

        }
    }

    render() {
        let {hash, isWriteOK, response} = this.state
        return (
            <div>
                <h2>请上传图片</h2>
                <div>
                    <input type='file' ref="fileid"/>
                    <button onClick={() => this.upload(this.refs.fileid.files[0])}>点击我上传到ipfs
                    </button>
                    {
                        hash && <h2>图片已经上传到ipfs: {hash}</h2>
                    }
                    {
                        hash && <button onClick={() => this.saveHashToEth()}>点击我上传到以太坊</button>
                    }
                    {
                        isWriteOK && <button onClick={() => this.getHash()}>点击我获取图片</button>
                    }
                    {
                        response &&
                        <div>
                            <img src={"http://localhost:8080/ipfs/" + response}/>
                        </div>
                    }
                </div>
            </div>
        )
    }


}

export default App;
