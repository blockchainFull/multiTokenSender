import { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form'
import { Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import XLSX from "xlsx";
import Web3 from 'web3';
import { AbiItem } from 'web3-utils'
import { BigNumber } from 'bignumber.js';
import Config, { API_KEY, BEP20_ABI, MULTISENDER_ABI } from './config.js'
import './App.css'
import { domainToUnicode } from 'url';

declare let window: any;

const WALLET_INIT = "CONNECT";
const CHAIN_NAMES = ['Ether mainnet', 'Binance'];
let web3 = new Web3(window.ethereum)

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  backButton: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

function getSteps() {
  return ['Step 1', 'Step 2', 'Step 3', 'Step 4'];
}


export default function App() {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [walletAddress, setWalletAddress] = useState(WALLET_INIT);
  const [tokenTransList, setTokenTransList] = useState<any[]>([]);
  const [tokenDecimal, setTokenDecimal] = useState(18);
  const [tokenAddr, setTokenAddr] = useState('0x0000');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState('BNB');
  const [tokenAllowance, setTokenAllowance] = useState(0);
  const [bnbBalance, setBnbBalance] = useState(0);
  const [feeToPay, setFeeToPay] = useState(0);
  const [estimateGas, setEstimateGas] = useState(0);
  const [approveLimit, setApproveLimit] = useState(0);
  const [receiptList, setReceiptList] = useState<any[]>([]);
  const [alertMsg, setAlertMsg] = useState('');
  const [data, setdata] = useState([])
  const [editText, setEditText] = useState(0)
  const [chainName, setChainName] = useState('');

  const changeChain = async (e: any) => {
    if (getChainId(e.target.value)) {
      window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: getChainId(e.target.value) }],
      }).then(() => {
        
      }).catch(() => {
        
      })
    }
  }

  const getChainId = (name: any) => {
    if (name === "Ether mainnet") {
      return '0x1';
    } else if (name === "Binance") {
      return '0x38';
    }
    return ""
  }

  const getChainName = () => {
    if (!window.ethereum) {
      return ""
    } else if (window.ethereum.chainId === "0x1") {
      return "Ether mainnet"
    } else if (window.ethereum.chainId === "0x38") {
      return  "Binance"
    } else {
      return ""
    }
  }

  const getContractAddr = () => {
    if (!window.ethereum) {
      return ""
    } else if (window.ethereum.chainId === "0x1") {
      return Config.ETH_CONTRACT_ADDR
    } else if (window.ethereum.chainId === "0x38") {
      return  Config.BSC_CONTRACT_ADDR
    } else {
      return ""
    }
  }

  const steps = getSteps();

  const handleNext = async () => {
    if (activeStep === 0) {
      if (data.length <= 0) {
        return;
      }

      if (tokenAddr !== "0x0000") {
        allowance();
      }

      if (getChainName() === "")
        return;
      let feeValue = await getFee();
      getEstimateGas(feeValue);

      let transArr: any[] = [];
      for (let i = 0; i < data.length; i++) {
        if (web3.utils.isAddress(data[i][0]) && !isNaN(data[i][1])) {
          transArr.push({ address: data[i][0], amount: Number(data[i][1]) });
        }
      }

      //Do modify after step1 is completed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! transArr -> receiptList!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      const tokenToSend = (transArr.reduce((a, v) => a = a + v.amount, 0)).toFixed(4);
      if (tokenAddr === "0x0000") {
        if (bnbBalance < tokenToSend * Math.pow(10, 18)) {
          setAlertMsg('Insufficient BNB balance');
        }
      } else {
        if (tokenBalance < tokenToSend * Math.pow(10, tokenDecimal)) {
          setAlertMsg('Insufficient Token balance');
        }
      }
      
      setReceiptList(transArr);
    } else if (activeStep === 1) {

    } else if (activeStep === 2) {
      if (tokenAddr === "0x0000") {
        await multisendEther();
      } else {
        await multisendToken();
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handlePrevious = () => {
    if (activeStep === 1) {
      setEditText(1)
      setAlertMsg('')
    } else if (activeStep === 2) {

    }
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed!')
    }

    /*** metamask connecting ***/
    window.ethereum.request({
      method: 'eth_requestAccounts'
    }).then((accounts: any) => {
      setWalletAddress(accounts[0])
      setChainName(getChainName())
    }).catch(() => {

    })
  }

  const examplearray = [
    [
      "0x81dead59e3a0423bed9ab5869901e41517458c1e",
      "20"
    ],
    [
      "0x81dead59e3a0423bed9ab5869901e41517458c1e",
      "100"
    ],
    [
      "0x81dead59e3a0423bed9ab5869901e41517458c1e1",
      "100"
    ],
    [
      "0x81dead59e3a0423bed9ab5869901e41517458c1e",
      "100"
    ]
  ]

  const showExample = () => {
    setdata([])
    setdata(examplearray)
  }
  // const handleFile = (file: any) => {
  //   console.log(file)
  //   setdata([]);
  //   /* Boilerplate to set up FileReader */
  //   const reader = new FileReader();
  //   const rABS = !!reader.readAsText;
  //   reader.onload = (e: any) => {
  //     /* Parse data */
  //     const bstr = e.target.result;
  //     // const wb = XLSX.read(bstr, { type:  "array" });
  //     const wb = XLSX.read(bstr, { type: rABS ? "binary" : "array" });
  //     // console.log(wb);
  //     /* Get first worksheet */
  //     const wsname = wb.SheetNames[0];
  //     const ws = wb.Sheets[wsname];
  //     /* Convert array of arrays */
  //     let data: any = XLSX.utils.sheet_to_json(ws, {
  //       header: 1
  //     });
  //     /* Update state */
  //     let filterArr: any[] = [];
  //     for (let i = 0; i < data.length; i++) {
  //       if (web3.utils.isAddress(data[i][0]) && !isNaN(data[i][1])) {
  //         filterArr.push(data[i]);
  //       }
  //     }

  //     setEditText(0)
  //     setdata([])
  //     setdata(filterArr)

  //   };
  //   if (rABS) reader.readAsBinaryString(file);
  //   else reader.readAsArrayBuffer(file);
  // }
  
  const handleFile = (file:any) => {
    const reader = new FileReader();
    setdata([]);
    reader.onload = (e) => {
      const text = String(e.target.result);
      const rows = text.split("\r\n");
      const dt = rows.map(row => {
        const values = row.split(',');
        return values;
      })
      setEditText(0);
      setdata([]);
      setdata(dt.slice(0, dt.length-1));
    }

    reader.readAsText(file);
  }
  

  const exportFile = () => {
    /* convert state to workbook */
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
    /* generate XLSX file and send to client */
    XLSX.writeFile(wb, "sheetjs.xlsx");
  }

  const uploadfile = () => {
    document.getElementById('file').click()
  }

  useEffect(() => {

  }, [data])
  useEffect(() => {
    if (walletAddress === WALLET_INIT) {
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed!')
      }

      window.ethereum.request({
        method: 'eth_accounts'
      }).then((accounts: any) => {
        const addr = (accounts.length <= 0) ? WALLET_INIT : accounts[0];
        if (accounts.length > 0) {
          setWalletAddress(addr);
        } else {
          setWalletAddress(WALLET_INIT);
        }
      })
    } else if (walletAddress !== "") {
      setTokenAddr("0x0000");
      setChainName(getChainName());
      if (getChainName() === "Binance") {
        fetch('https://api.bscscan.com/api?module=account&action=tokentx&address=' + walletAddress + '&startblock=0&endblock=30000000&sort=asc&apikey=' + API_KEY, {
          method: 'GET',
        }).then(res => res.json()
        ).then(res => {
          console.log(res)
          if (res.message === "OK") {
            let transArr: any[] = [];
            for (let index = 0; index < res.result.length; index++) {
              const element = res.result[index];
              let already = false;
              for (let j = 0; j <= index - 1; j++) {
                if (element.contractAddress === res.result[j].contractAddress) {
                  already = true;
                  break;
                }
              }
              if (already === false) {
                transArr.push(element)
              }
            }
            setTokenTransList(transArr);
          } else {
            setTokenTransList([]);
          }
        })

        fetch('https://api.bscscan.com/api?module=account&action=balance&address=' + walletAddress + '&tag=latest&apikey=' + API_KEY, {
          method: 'GET',
        }).then(res => res.json()
        ).then(val => {
          if (val.message === "OK") {
            setTokenBalance(val.result);
            setBnbBalance(val.result);
          } else {
            setTokenBalance(0)
            setBnbBalance(0);
          }
        })
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    window.ethereum.on('chainChanged', (chainId: any) => {
      if (CHAIN_NAMES.indexOf(getChainName()) < 0) {
        setChainName('')
        alert('wrong network!')
      } else {
        if (walletAddress !== "" && walletAddress !== WALLET_INIT) {
          
          setTokenAddr("0x0000");
          setChainName(getChainName());
          
          if (getChainName() === "Binance") {
            fetch('https://api.bscscan.com/api?module=account&action=tokentx&address=' + walletAddress + '&startblock=0&endblock=10000000&sort=asc&apikey=' + API_KEY, {
              method: 'GET',
            }).then(res => res.json()
            ).then(res => {
              if (res.message === "OK") {
                let transArr: any[] = [];
                for (let index = 0; index < res.result.length; index++) {
                  const element = res.result[index];
                  let already = false;
                  for (let j = 0; j <= index - 1; j++) {
                    if (element.contractAddress === res.result[j].contractAddress) {
                      already = true;
                      break;
                    }
                  }
                  if (already === false) {
                    transArr.push(element)
                  }
                }
                setTokenTransList(transArr);
              } else {
                setTokenTransList([]);
              }
            })
          }
          setTokenBalance(0)
          setBnbBalance(0)
        }
      }
    });

    /***** when account is changed *****/
    window.ethereum.on('accountsChanged', (accounts: any) => {
      if (accounts[0]) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress(WALLET_INIT);
        setChainName('')
      }
    })

    return () => {
      window.ethereum.removeAllListeners();
    }
  })

  const selectToken = async (key: any) => {
    setTokenAddr(key)

    if (key !== "0x0000") {
      for (let index = 0; index < tokenTransList.length; index++) {
        const element = tokenTransList[index];
        if (element.contractAddress === key) {
          setTokenDecimal(element.tokenDecimal);
          setTokenSymbol(element.tokenSymbol);
        }
      }

      if (getChainName() === "Binance") {
        await fetch('https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=' + key + '&address=' + walletAddress + '&tag=latest&apikey=' + API_KEY, {
          method: 'GET',
        }).then(res => res.json()
        ).then(val => {
          if (val.message === "OK") {
            setTokenBalance(val.result)
          } else {
            setTokenBalance(0)
          }
        })
      }
    } else {
      setTokenAddr("0x0000")
      setTokenDecimal(18)
      if (getChainName() === "Binance") {
        setTokenSymbol('BNB');
      } else {
        setTokenSymbol('Ether');
      }
      

      if (getChainName() === "Binance") {
        await fetch('https://api.bscscan.com/api?module=account&action=balance&address=' + walletAddress + '&tag=latest&apikey=' + API_KEY, {
          method: 'GET',
        }).then(res => res.json()
        ).then(val => {
          if (val.message === "OK") {
            setTokenBalance(val.result)
          } else {
            setTokenBalance(0)
          }
        })
      }
    }
  }

  const approve = async () => {
    let amount;
    if (approveLimit === 0) {
      let amountBn = new BigNumber((receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4) * Math.pow(10, tokenDecimal));
      amount = "0x" + amountBn.toString(16);
    } else {
      amount = '100000000000000000000000000000000000000000000000000000000000000';
    }
    const tokenContract = new web3.eth.Contract(BEP20_ABI as AbiItem[], tokenAddr);
    await tokenContract.methods.approve(getContractAddr(), amount).send(
      { from: walletAddress }
    ).then((res: number) => {
      allowance();
      handleNext();
    }).catch((err: any) => {

    });
  }

  const allowance = async () => {
    const tokenContract = new web3.eth.Contract(BEP20_ABI as AbiItem[], tokenAddr);
    tokenContract.methods.allowance(walletAddress, getContractAddr()).call(
    ).then((res: number) => {
      setTokenAllowance(Number(res));
      let transArr: any[] = [];
      for (let i = 0; i < data.length; i++) {
        if (web3.utils.isAddress(data[i][0]) && !isNaN(data[i][1])) {
          transArr.push({ address: data[i][0], amount: Number(data[i][1]) });
        }
      }

      let tokenToSend = (transArr.reduce((a, v) => a = a + v.amount, 0)).toFixed(4);

      if (Number(res) < tokenToSend * Math.pow(10, tokenDecimal)) {
        setAlertMsg("Transfer amount exceeds allowance")
      }
    })
  }

  const getFee = async () => {
    const senderContract = new web3.eth.Contract(MULTISENDER_ABI as AbiItem[], getContractAddr());
    try {
      let res = await senderContract.methods.currentFee(walletAddress).call()
      setFeeToPay(Number(res));
      return Number(res);  
    } catch (error) {
      setAlertMsg('Error with smart contract')
      return 0
    }
    
  }

  const getEstimateGas = async (feeValue: number) => {
    const senderContract = new web3.eth.Contract(MULTISENDER_ABI as AbiItem[], getContractAddr());
    if (tokenAddr === "0x0000") {
      let addressList: any[] = [];
      let amountList: any[] = [];
      let bnbPay: number = 0;
      for (let i = 0; i < data.length; i++) {
        addressList.push(data[i][0].toLowerCase());
        let bnb = new BigNumber(Math.pow(10, 18) * data[i][1])
        amountList.push(bnb.toString());
        bnbPay = bnbPay + data[i][1] * Math.pow(10, 18);
      }
      
      bnbPay = bnbPay + feeValue;
      
      let bnbPayable = bnbPay

      let gasPrice = await web3.eth.getGasPrice();
      senderContract.methods.multisendEther(addressList, amountList).estimateGas({ from: walletAddress, value: "0x" + Math.round(bnbPayable).toString(16) })
      .then(function (gasAmount: any) {
        setEstimateGas(Number(gasPrice) * Number(gasAmount));
      })
      .catch(function (error: any) {
        console.log('error', error)
      });
    } else {  
      let addressList: any[] = [];
      let amountList: any[] = [];
      for (let i = 0; i < data.length; i++) {
        addressList.push(data[i][0]);
        let token = Math.pow(10, tokenDecimal) * data[i][1]
        amountList.push(Math.round(token).toString());
      }

      let bnbpayable = feeValue

      let gasPrice = await web3.eth.getGasPrice();

      senderContract.methods.multisendToken(tokenAddr, addressList, amountList).estimateGas({ from: walletAddress, value: "0x" + Math.round(bnbpayable).toString(16)})
      .then(function (gasAmount: any) {
        setEstimateGas(Number(gasPrice) * Number(gasAmount));
      })
      allowance();
    }
    
  }

  const multisendEther = async () => {
    let addressList: any[] = [];
    let amountList: any[] = [];
    let bnbPay: number = 0;
    for (let i = 0; i < receiptList.length; i++) {
      addressList.push(receiptList[i].address);
      let bnb = new BigNumber(Math.pow(10, 18) * receiptList[i].amount)
      amountList.push("0x"+bnb.toString(16));
      bnbPay = bnbPay + receiptList[i].amount * Math.pow(10, 18);
    }

    bnbPay = bnbPay + feeToPay;
    
    let bnbPayable = bnbPay
    
    const senderContract = new web3.eth.Contract(MULTISENDER_ABI as AbiItem[], getContractAddr());
    await senderContract.methods.multisendEther(addressList, amountList).send(
      { from: walletAddress, value:  "0x" + Math.round(bnbPayable).toString(16)}
    )
  }

  const multisendToken = async () => {
    let addressList: any[] = [];
    let amountList: any[] = [];
    for (let i = 0; i < receiptList.length; i++) {
      addressList.push(receiptList[i].address);
      let token = Math.pow(10, tokenDecimal) * receiptList[i].amount
      console.log(token)
      amountList.push("0x"+ Math.round(token).toString(16));
    }

    let bnbpayable = feeToPay

    const senderContract = new web3.eth.Contract(MULTISENDER_ABI as AbiItem[], getContractAddr());
    await senderContract.methods.multisendToken(tokenAddr, addressList, amountList).send(
      { from: walletAddress, value: "0x"+ Math.round(bnbpayable).toString(16) }
    )
    allowance();
  }

  const parseTextBox = async (e: any) => {
    let innerHtml = e.innerHTML;
    innerHtml = innerHtml.replaceAll('<div class="individual_address">', '')
    innerHtml = innerHtml.replaceAll('</div>', ';');
    innerHtml = innerHtml.replaceAll('<br>', '');
    innerHtml = innerHtml.replaceAll(' ', '');
    let receiptArr = innerHtml.split(';')
    receiptArr = receiptArr.filter((item: string) => item !== "")

    let newDataArr = [];
    for (let i = 0; i < receiptArr.length; i++) {
      let elem = receiptArr[i].split(",")
      if (!web3.utils.isAddress(elem[0]) || isNaN(parseInt(elem[1]))) {
        setAlertMsg('Input Syntax error');
        return;
      }
      newDataArr[i] = [elem[0], Number(elem[1])];
    }
    setAlertMsg("")

    setdata(newDataArr)
    setEditText(1)
  }

  const focusOutTextBox = () => {
    console.log(editText)
    //setEditText(0)
  }

  return (
    <div className='main_page'>
      <Container>
        <Row className="justify-content-md-center">
          <Col className="mt-5">LOGO</Col>
          <Col className="justify-content-md-center mt-5">
            <Button className="float-right" variant="contained" color="primary" onClick={connectWallet}>{(walletAddress === 'CONNECT') ? walletAddress : (walletAddress.substring(0, 7) + "..." + walletAddress.slice(-4))}</Button>
            {(chainName.length > 0) && <select className="float-right chain-button" aria-label="Default select example" value={chainName} onChange={(e) => changeChain(e)}>
              {CHAIN_NAMES.map((e: any, i: any) => {
                  return <option key={i} defaultValue={(e === chainName) ? "true" : "false"}>{e}</option>
              })}
            </select>}

          </Col>
        </Row>

        <Row className="justify-content-md-center">
          <Col className="mt-2 mb-2 text-center main_page_heading">Welcome To Our Website</Col>
        </Row>

        <Row>
          <Col>
            <div className={classes.root}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </div>
          </Col>
        </Row>

        {
          activeStep === 0
            ?
            <div className="row step_one">
              <div className="col-md-2"></div>
              <div className="col-md-8">
                <div className="row">
                  <div className="col-md-10">
                    <div className="form-group">

                      <Form.Group controlId="exampleForm.ControlSelect1">
                        <Form.Label>
                          <div className="row">
                            <div className="col-md-5">
                              Token &nbsp;&nbsp; {(tokenAddr !== "0x0000") && <a href={chainName === "Binance" ? "https://bscscan.com/address/" : "https://etherscan.io/address" + tokenAddr} target="_blank" rel="noopener noreferrer">{tokenAddr.substring(0, 7) + "..." + tokenAddr.slice(-4)}</a>}
                            </div>
                            <div>
                              Balance &nbsp;&nbsp; {tokenBalance / Math.pow(10, tokenDecimal)}
                            </div>
                          </div>
                        </Form.Label>
                        <Form.Control as="select" value={tokenAddr} onChange={(e) => selectToken(e.target.value)}>
                          <option value="0x0000">{(chainName === "Binance") ? "BNB" : "Ether"}</option>
                          {tokenTransList.map((e: any, index: any) => {
                            return <option key={index} value={e.contractAddress} >{e.tokenName}</option>
                          })}
                        </Form.Control>
                      </Form.Group>

                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label>Decimals</label>
                      <input type="text" className="form-control" value={tokenDecimal} readOnly />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <DragDropFile handleFile={handleFile}>
                    <div style={{ display: 'none' }}>
                      <div className="row">
                        <div className="col-xs-12">
                          <DataInput handleFile={handleFile} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-xs-12">
                          <button
                            disabled={!data.length}
                            className="btn btn-success"
                            onClick={exportFile}
                          >
                            Export
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-xs-12">
                      <label>Comment <span onClick={uploadfile}>Upload File</span></label>
                      <div className="listofaddresses" contentEditable suppressContentEditableWarning={true} onInput={(e) => parseTextBox(e.target)} onBlur={() => focusOutTextBox()}>
                        <div className="individual_address">0x81dead59e3a0423bed9ab5869901e41517458c1e, 100</div>
                        {(editText === 0)  && data.map((r: any, i: any) => {
                          return <div className="individual_address" key={i} >{r[0]}, {r[1]}</div>
                        }
                        )}
                        {/*<OutTable data={data} />*/}
                      </div>
                    </div>
                  </DragDropFile>


                </div>
                <div className="row address_details">
                  <div className="col-md-9">
                    <p>The address and amount are separated by commas</p>
                  </div>
                  <div className="col-md-3 text-right">
                    <p><span onClick={showExample}>Show Examples</span></p>
                  </div>
                </div>
                {(alertMsg !== "") && <div className="address_total">
                  <div className="alert">
                    {alertMsg}
                  </div>
                </div>}
                <button onClick={(alertMsg === "") ? handleNext : undefined} style={{ cursor: (alertMsg !== "") ? "not-allowed" : "pointer" }} className="MuiButtonBase-root MuiButton-root MuiButton-contained float-right MuiButton-containedPrimary" type="button"><span className="MuiButton-label">Next Step</span></button>
              </div>
            </div>
            :
            activeStep === 1
              ?
              <div className="row step_two">
                <div className="col-md-2"></div>
                <div className="col-md-8">
                  <label>List of Recipients</label>
                  <div className="recipent_list list-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Address</th>
                          <th>Amount</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptList.map((e, index) => {
                          return <tr key={index}>
                            <td>{e.address}</td>
                            <td>{e.amount} {tokenSymbol}</td>
                            {/*<td><span>Remove</span></td>*/}
                          </tr>
                        }
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="address_total">
                    <label>Summary</label>
                    <div className="col-md-12 details_block_transaction">
                      {(tokenAddr !== "0x0000") && <div className="row">
                        <div className="col-md-6">
                          <h3>{(tokenAddr !== "0x0000") && tokenAllowance / Math.pow(10, tokenDecimal)} {tokenSymbol}</h3>
                          <h6>Your current bulksender allowance</h6>
                        </div>
                        <div className="col-md-6">
                          <h3>{(approveLimit === 0) ? (receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4) : "1e54"} {tokenSymbol}</h3>
                          <h6>Request approve amount</h6>
                        </div>
                      </div>}
                      <div className="row">
                        <div className="col-md-6">
                          <h3>{receiptList.length}</h3>
                          <h6>Total number of addresses</h6>
                        </div>
                        <div className="col-md-6">
                          <h3>{(feeToPay + estimateGas) / Math.pow(10, 18)} BNB</h3>
                          <h6>Approximate cost of operation</h6>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <h3>{Math.ceil(receiptList.length / 150)}</h3>
                          <h6>Total number of transactions needed</h6>
                        </div>
                        <div className="col-md-6">
                          <h3>{(receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4)} {tokenSymbol}</h3>
                          <h6>Total number of tokens to be sent</h6>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <h3>{bnbBalance / Math.pow(10, 18)} BNB</h3>
                          <h6>Your BNB balance</h6>
                        </div>
                        <div className="col-md-6">
                          <h3>{tokenBalance / Math.pow(10, tokenDecimal)} {tokenSymbol}</h3>
                          <h6>Your token balance</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(alertMsg !== "") && <div className="address_total">
                    <div className="alert">
                      {alertMsg}
                    </div>
                  </div>}
                  {(tokenAddr !== "0x0000" && tokenAllowance < (receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4) * Math.pow(10, tokenDecimal)) && <div className="row">
                    <div className="col-md-6 text-left">
                      <Form.Check inline label="Exact amount to be sent" name="group1" type="radio" id="inline-checkbox-1" style={{ color: "grey" }} onClick={() => setApproveLimit(0)} defaultChecked={(approveLimit === 0) ? true : false}/>
                      <Form.Check inline label="Unlimited amount" name="group1" type="radio" id="inline-checkbox-2" style={{ color: "grey" }} onClick={() => setApproveLimit(1)} defaultChecked={(approveLimit !== 0) ? true : false}/>
                    </div>
                  </div>}
                  <div className="row">
                    <div className="col-md-6 text-left">
                      <button onClick={handlePrevious} className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary" type="button">Previous Step</button>
                    </div>
                    <div className="col-md-6 text-right">
                      <button onClick={(tokenAddr === "0x0000" || tokenAllowance >= (receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4) * Math.pow(10, tokenDecimal)) ? handleNext : approve} className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary" type="button" disabled={(alertMsg === "" || (tokenAddr !== "0x0000" && tokenAllowance < (receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4) * Math.pow(10, tokenDecimal))) ? false : true} style={{ cursor: (alertMsg === "" || (tokenAddr !== "0x0000" && tokenAllowance < (receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4) * Math.pow(10, tokenDecimal))) ? "pointer" : "not-allowed" }}>{(tokenAddr === "0x0000" || tokenAllowance >= (receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4) * Math.pow(10, tokenDecimal)) ? "Next" : "Approve"}</button>
                    </div>
                  </div>

                </div>
              </div>
              :
              activeStep === 2
                ?
                <div className="row step_two">
                  <div className="col-md-2"></div>
                  <div className="col-md-8">
                    <div className="address_total">
                      <label>Summary</label>
                      <div className="col-md-12 details_block_transaction">
                        <div className="row">
                          <div className="col-md-6">
                            <h3>{receiptList.length}</h3>
                            <h6>Total number of addresses</h6>
                          </div>
                          <div className="col-md-6">
                            <h3>{(feeToPay + estimateGas) / Math.pow(10, 18)} BNB</h3>
                            <h6>Approximate cost of operation</h6>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <h3>{Math.ceil(receiptList.length / 150)}</h3>
                            <h6>Total number of transactions needed</h6>
                          </div>
                          <div className="col-md-6">
                            <h3>{(receiptList.reduce((a, v) => a = a + v.amount, 0)).toFixed(4)} {tokenSymbol}</h3>
                            <h6>Total number of tokens to be sent</h6>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <h3>{bnbBalance / Math.pow(10, 18)} BNB</h3>
                            <h6>Your BNB balance</h6>
                          </div>
                          <div className="col-md-6">
                            <h3>{tokenBalance / Math.pow(10, tokenDecimal)} {tokenSymbol}</h3>
                            <h6>Your token balance</h6>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 text-left">
                        <button onClick={handlePrevious} className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary" type="button">Previous Step</button>
                      </div>
                      <div className="col-md-6 text-right">
                        <button onClick={handleNext} className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary" type="button">Next</button>
                      </div>
                    </div>

                  </div>
                </div>
                :
                <div className="row step_two">
                  <div className="col-md-2"></div>
                  <div className="col-md-8">
                    <h4 className="successfully_transferred">Successfully Transferred</h4>
                    <div className="recipent_list">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Address</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>0x7Ad48EB59E7378405c71aCA6CA8AcF7a45f050d5</td>
                            <td>95 ANO</td>
                          </tr>
                          <tr>
                            <td>0x7Ad48EB59E7378405c71aCA6CA8AcF7a45f050d5</td>
                            <td>95 ANO</td>
                          </tr>
                          <tr>
                            <td>0x7Ad48EB59E7378405c71aCA6CA8AcF7a45f050d5</td>
                            <td>95 ANO</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
        }


      </Container>
    </div>
  );
}


export const DragDropFile = (props: any) => {

  const suppress = (evt: any) => {
    evt.stopPropagation();
    evt.preventDefault();
  }
  const onDrop = (evt: any) => {
    evt.stopPropagation();
    evt.preventDefault();
    const files = evt.dataTransfer.files;
    if (files && files[0]) props.handleFile(files[0]);
  }


  return (
    <div
      onDrop={onDrop}
      onDragEnter={suppress}
      onDragOver={suppress}
    >
      {props.children}
    </div>
  );
}

export const DataInput = (props: any) => {

  const handleChange = (e: any) => {
    const files = e.target.files;
    if (files && files[0]) props.handleFile(files[0]);
  }

  return (
    <form className="form-inline">
      <div className="form-group">
        <label htmlFor="file">Spreadsheet</label>
        <input
          type="file"
          className="form-control"
          id="file"
          accept=".csv,application/vnd.ms-excel,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleChange}
        />
      </div>
    </form>
  );
}

export const OutTable = (props: any) => {
  console.log(props.data)
  return (
    <div className="table-responsive">
      {props.data.map((r: any, i: any) => {
        return <div key={i}><div className="individual_address" >{r[0]}, {r[1]}</div></div>
      })}
    </div>
  );
}


/* list of supported file types */
const SheetJSFT = [
  "xlsx",
  "csv"
]
  .map(function (x) {
    return "." + x;
  })
  .join(",");

// /* generate an array of column objects */
// const make_cols = (refstr : any) => {
//   let o = [],
//     C = XLSX.utils.decode_range(refstr).e.c + 1;
//   for (var i = 0; i < C; ++i) o[i] = { name: XLSX.utils.encode_col(i), key: i };
//   return o;
// };
