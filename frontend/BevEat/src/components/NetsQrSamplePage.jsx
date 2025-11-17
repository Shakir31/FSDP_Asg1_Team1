import React, { Component } from "react";
import Button from "@mui/material/Button";
import txnLoading from "../assets/progressSpinner.gif";
import commonConfigs from "../config";
import axios from "axios";
import { EventSourcePolyfill } from "event-source-polyfill";
import '../NetsQrSamplePage.css';

class NetsQrSampleLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      convertTime: {},
      secondsNetsTimeout: 300,
      amount: '3',
      txnId: "sandbox_nets|m|8ff8e5b6-d43e-4786-8ac5-7accf8c5bd9b",
      mobile: 0,
      netsQrPayment: txnLoading,
      netsQrRetrievalRef: "",
      netsQrGenerate: false,
      netsQrDisplayLogo: false,
      netsQrResponseCode: "",
      openApiPaasTxnStatus: 0,
      networkCode: "",
      instruction: "",
      errorMsg: "",
      netsSecretKey: '',
      hmacChallengeGenerate: "",
    };
    this.netsTimer = 0;
    this.queryNets = this.queryNets.bind(this);
    this.startNetsTimer = this.startNetsTimer.bind(this);
    this.decrementNetsTimer = this.decrementNetsTimer.bind(this);

    this.isApiCalled = false;
  }

  async requestNets(amount, txnId, mobile) {
    try {
      this.setState({ netsQrGenerate: true })
      var body = {
        txn_id: txnId,
        amt_in_dollars: amount,
        notify_mobile: mobile
      }

      console.log(body);

      await axios.post(commonConfigs.apiUrls.requestNetsApi(), body, { headers: commonConfigs.apiHeader })
      .then((res) => {
          console.log(res);
          var resData = res.data.result.data;

          if (
            resData.response_code == "00" &&
            resData.txn_status == 1 &&
            resData.qr_code !== "" &&
            resData.qr_code !== null
          ) {
            localStorage.setItem("txnRetrievalRef", resData.txn_retrieval_ref);
            this.startNetsTimer();
            this.setState({
              netsQrResponseCode: resData.response_code,
              netsQrPayment: "data:image/png;base64," + resData.qr_code,
              netsQrRetrievalRef: resData.txn_retrieval_ref,
              networkCode: resData.network_status,
              openApiPaasTxnStatus: resData.txn_status
            });
            this.webhookNets();
          } else {
            this.setState({
              netsQrResponseCode:
                resData.response_code === "" ? "N.A." : resData.response_code,
              netsQrPayment: "",
              instruction:
                resData.network_status == 0 ? resData.instruction : "",
              errorMsg:
                resData.network_status !== 0 ? "Frontend Error Message" : "",
              networkCode: resData.network_status,
              openApiPaasTxnStatus: resData.txn_status
            });
          }
      })
      .catch((err) => {
          console.log(err);
          window.location.href = "/nets-qr/fail";
      });
    } catch (err) {
      this.setState({
        errorMsg: "Error in requestNets: " + (err && err.message ? err.message : String(err)),
      });
    } finally {
      this.isApiCalled = false;
    }
  }

  webhookNets() {
    if (this.s2sNetsTxnStatus) {
      this.s2sNetsTxnStatus.close();
    }
    const webhookNetsApiUrl = commonConfigs.apiUrls.webhookNetsApi(
      localStorage.getItem("txnRetrievalRef")
    );

    try {
      this.s2sNetsTxnStatus = new EventSourcePolyfill(webhookNetsApiUrl, {
        headers: commonConfigs.apiHeader,
        heartbeatTimeout: 150000,
      });

      this.s2sNetsTxnStatus.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        console.log(data.message);
        console.log("Message detected");
        if (data.message === "QR code scanned" && data.response_code === "00") {
          if (this.s2sNetsTxnStatus) {
            this.s2sNetsTxnStatus.close();
          }
          console.log(data);
          window.location.href = "/nets-qr/success";
        } else if (data.message === "Timeout") {
          if (this.s2sNetsTxnStatus) {
            this.s2sNetsTxnStatus.close();
          }
          this.queryNets();
        }
      })
    } catch (err) {
      this.setState({
        errorMsg: "Error in webhookNets: " + (err && err.message ? err.message : String(err)),
      });
    }
  }

  async queryNets() {
    try {
      var netsTimeoutStatus = 0;
      if (this.state.secondsNetsTimeout == 0) {
        netsTimeoutStatus = 1;
      }

      if (this.state.netsQrRetrievalRef) {
        var body = {
          txn_retrieval_ref: this.state.netsQrRetrievalRef,
          frontend_timeout_status: netsTimeoutStatus,
        };
        console.log(body);
        await axios.post(commonConfigs.apiUrls.queryNetsApi(), body, { headers: commonConfigs.apiHeader })
          .then((res) => {
            var resData = res.data.result.data;
            console.log(resData);

            if (resData.response_code == "00" && resData.txn_status == 1) {
              window.location.href = "/nets-qr/success";
            } else {
              window.location.href = "/nets-qr/fail";
            }
          })
          .catch((err) => {
            console.log(err);
            window.location.href = "/nets-qr/fail";
          });
      }
    } catch (err) {
      this.setState({
        errorMsg: "Error in queryNets: " + (err && err.message ? err.message : String(err)),
      });
    }
  }

  startNetsTimer() {
    if (this.netsTimer == 0 && this.state.secondsNetsTimeout > 0) {
      this.netsTimer = setInterval(this.decrementNetsTimer, 1000);
    }
  }
  convertTimeFormat(secs) {
    let minutes = Math.floor(secs / 60);
    let seconds = secs % 60;

    return {
      m: minutes,
      s: seconds,
    };
  }

  decrementNetsTimer() {
    let secondsNetsTimeout = this.state.secondsNetsTimeout - 1;
    this.setState({
      convertTime: this.convertTimeFormat(secondsNetsTimeout),
      secondsNetsTimeout: secondsNetsTimeout,
    });

    if (secondsNetsTimeout == 0) {
      clearInterval(this.netsTimer);
    }
  }

  handleNetsReq() {
    if (!this.isApiCalled) {
      this.isApiCalled = true;
      this.requestNets(this.state.amount, this.state.txnId, this.state.mobile);
      this.setState({ netsQrDisplayLogo: true });
      document.getElementById("btnNets").style.display = "none";
    }
  }

  handleNetsCancel() {
    this.setState({
      netsQrRetrievalRef: ""
    }, () => window.location.reload(false))
    this.setState({ netsQrDisplayLogo: false });
  }

  handleHmacChallenge() {
    // example HMAC flow (optional)
    // document.getElementById('btnNets').style.display = 'none';
    // const reqBody = { /* NETS sample request body */ };
    // const payload = JSON.stringify(reqBody)
    // const { netsSecretKey } = this.state;
    // const hmac = generateHmac(payload, netsSecretKey);
    // this.setState({ hmacChallengeGenerate: hmac })
    // console.log('Generated HMAC:', hmac)
  }

  render() {
    return (
      <div style={{ position: "relative" }}>
        {/* UI omitted here for brevity; keep from original file when pasting */}
      </div>
    );
  }
}

export default NetsQrSampleLayout;