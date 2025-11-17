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
      amount: "3",
      txnId: "sandbox_nets|m|8ff8e5b6-d43e-4786-8ac5-7accf8c5bd9b",
      mobile: "",
      netsQrPayment: txnLoading,
      netsQrRetrievalRef: "",
      netsQrGenerate: false,
      netsQrDisplayLogo: false,
      netsQrResponseCode: "",
      openApiPaasTxnStatus: 0,
      networkCode: "",
      instruction: "",
      errorMsg: "",
      logo: null,
      infoImage: null,
      lastResponse: null,
    };
    this.netsTimer = 0;
    this.queryNets = this.queryNets.bind(this);
    this.startNetsTimer = this.startNetsTimer.bind(this);
    this.decrementNetsTimer = this.decrementNetsTimer.bind(this);

    this.isApiCalled = false;
  }

  componentDidMount() {
    import("../assets/netsQRInfo.png")
      .then((mod) => this.setState({ infoImage: mod.default }))
      .catch(() => { /* ignore */ });

    import("../assets/netsQrLogo.png")
      .then((mod) => this.setState({ logo: mod.default }))
      .catch(() => { /* ignore */ });
  }

  async requestNets(amount, txnId, mobile) {
    try {
      this.setState({ netsQrGenerate: true, netsQrPayment: txnLoading, errorMsg: "", lastResponse: null });

      const body = { txn_id: txnId, amt_in_dollars: amount, notify_mobile: mobile };
      console.info("NETS request body:", body);

      const res = await axios.post(
        commonConfigs.apiUrls.requestNetsApi(),
        body,
        { headers: commonConfigs.apiHeader, timeout: 15000 }
      );

      console.info("NETS response:", res);
      const resData = res.data?.result?.data ?? res.data;
      this.setState({ lastResponse: res.data });

      if (resData && resData.response_code === "00" && resData.txn_status === 1 && resData.qr_code) {
        localStorage.setItem("txnRetrievalRef", resData.txn_retrieval_ref);
        this.startNetsTimer();
        this.setState({
          netsQrResponseCode: resData.response_code,
          netsQrPayment: "data:image/png;base64," + resData.qr_code,
          netsQrRetrievalRef: resData.txn_retrieval_ref,
          networkCode: resData.network_status,
          openApiPaasTxnStatus: resData.txn_status,
          errorMsg: "",
        });
        this.webhookNets();
      } else {
        this.setState({
          netsQrResponseCode: resData?.response_code ?? "N/A",
          netsQrPayment: "",
          instruction: resData?.network_status === 0 ? resData?.instruction : "",
          errorMsg: resData?.message || resData?.error || "Transaction failed — see details below.",
          networkCode: resData?.network_status,
          openApiPaasTxnStatus: resData?.txn_status,
        });
      }
    } catch (err) {
      console.error("requestNets error", err);
      const status = err?.response?.status;
      const body = err?.response?.data ?? err?.message ?? "Network or server error";
      // show HTTP status and server body in UI
      this.setState({
        netsQrGenerate: true,
        netsQrPayment: "",
        errorMsg: `HTTP ${status || "ERR"} — ${typeof body === "string" ? body : JSON.stringify(body)}`,
        lastResponse: body,
      });
    } finally {
      this.isApiCalled = false;
    }
  }

  webhookNets() {
    if (this.s2sNetsTxnStatus) {
      this.s2sNetsTxnStatus.close();
    }
    const txnRef = localStorage.getItem("txnRetrievalRef");
    if (!txnRef) {
      this.setState({ errorMsg: "Missing txnRetrievalRef for webhook." });
      return;
    }
    const webhookNetsApiUrl = commonConfigs.apiUrls.webhookNetsApi(txnRef);

    try {
      this.s2sNetsTxnStatus = new EventSourcePolyfill(webhookNetsApiUrl, {
        headers: commonConfigs.apiHeader,
        heartbeatTimeout: 150000,
      });

      this.s2sNetsTxnStatus.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message === "QR code scanned" && data.response_code === "00") {
            if (this.s2sNetsTxnStatus) this.s2sNetsTxnStatus.close();
            window.location.href = "/nets-qr/success";
          } else if (data.message === "Timeout") {
            if (this.s2sNetsTxnStatus) this.s2sNetsTxnStatus.close();
            this.queryNets();
          } else {
            // update intermediate status
            this.setState({ lastResponse: data });
          }
        } catch (e) {
          console.warn("Malformed SSE message", e);
        }
      });

      this.s2sNetsTxnStatus.addEventListener("error", (err) => {
        console.error("SSE error", err);
        this.setState({ errorMsg: "SSE connection error (webhook); server may not support SSE." });
      });
    } catch (err) {
      this.setState({
        errorMsg: "Error in webhookNets: " + (err?.message || String(err)),
      });
    }
  }

  async queryNets() {
    try {
      let netsTimeoutStatus = 0;
      if (this.state.secondsNetsTimeout === 0) {
        netsTimeoutStatus = 1;
      }

      if (this.state.netsQrRetrievalRef) {
        const body = {
          txn_retrieval_ref: this.state.netsQrRetrievalRef,
          frontend_timeout_status: netsTimeoutStatus,
        };

        const res = await axios.post(
          commonConfigs.apiUrls.queryNetsApi(),
          body,
          { headers: commonConfigs.apiHeader }
        );
        const resData = res.data?.result?.data;
        if (resData?.response_code === "00" && resData?.txn_status === 1) {
          window.location.href = "/nets-qr/success";
        } else {
          window.location.href = "/nets-qr/fail";
        }
      }
    } catch (err) {
      console.error("queryNets error", err);
      window.location.href = "/nets-qr/fail";
    }
  }

  startNetsTimer() {
    if (this.netsTimer === 0 && this.state.secondsNetsTimeout > 0) {
      this.netsTimer = setInterval(this.decrementNetsTimer, 1000);
    }
  }

  convertTimeFormat(secs) {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return { m: minutes, s: seconds };
  }

  decrementNetsTimer() {
    const secondsNetsTimeout = this.state.secondsNetsTimeout - 1;
    this.setState({
      convertTime: this.convertTimeFormat(secondsNetsTimeout),
      secondsNetsTimeout,
    });

    if (secondsNetsTimeout === 0) {
      clearInterval(this.netsTimer);
    }
  }

  handleNetsReq() {
    if (!this.isApiCalled) {
      this.isApiCalled = true;
      this.requestNets(this.state.amount, this.state.txnId, this.state.mobile);
      this.setState({ netsQrDisplayLogo: true });
      const btn = document.getElementById("btnNets");
      if (btn) btn.style.display = "none";
    }
  }

  handleNetsCancel() {
    if (this.s2sNetsTxnStatus) {
      try { this.s2sNetsTxnStatus.close(); } catch(e){/*ignore*/ }
    }
    this.setState(
      {
        netsQrRetrievalRef: "",
        netsQrPayment: txnLoading,
        netsQrGenerate: false,
        netsQrDisplayLogo: false,
        secondsNetsTimeout: 300,
        convertTime: {},
        lastResponse: null,
        errorMsg: "",
      },
      () => window.location.reload(false)
    );
  }

  render() {
    const {
      infoImage,
      logo,
      netsQrPayment,
      netsQrGenerate,
      convertTime,
      secondsNetsTimeout,
      netsQrResponseCode,
      networkCode,
      instruction,
      errorMsg,
      lastResponse,
    } = this.state;

    const timerText =
      secondsNetsTimeout > 0
        ? `${convertTime.m || 0}m : ${String(convertTime.s || 0).padStart(2, "0")}s`
        : "00:00";

    return (
      <div className="nets-qr-container">
        {infoImage && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <img src={infoImage} alt="NETS Info" style={{ maxWidth: 360, height: "auto" }} />
          </div>
        )}

        {logo && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <img src={logo} alt="NETS Logo" style={{ maxWidth: 380, width: "100%", height: "auto" }} />
          </div>
        )}

        <div className="nets-actions" style={{ textAlign: "center" }}>
          <Button
            id="btnNets"
            variant="contained"
            onClick={() => this.handleNetsReq()}
            sx={{ mr: 2 }}
          >
            Generate NETS QR
          </Button>

          <Button variant="outlined" color="error" onClick={() => this.handleNetsCancel()} sx={{ ml: 2 }}>
            Cancel
          </Button>
        </div>

        <div className="nets-qr-area" style={{ marginTop: 20, textAlign: "center" }}>
          {netsQrGenerate && (
            <div className="nets-qr-display">
              {/* show QR image only if available; otherwise show placeholder or spinner */}
              {netsQrPayment ? (
                <img src={netsQrPayment} alt="NETS QR" className="nets-qr-img" />
              ) : (
                <div style={{ width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #f0b88a", background: "#fff" }}>
                  <div style={{ color: "#d66", padding: 8 }}>
                    {errorMsg ? "No QR available" : "Generating..."}
                  </div>
                </div>
              )}

              <div className="nets-qr-meta" style={{ marginTop: 8 }}>
                <p>Timeout: {timerText}</p>
                <p>Response code: {netsQrResponseCode || "N.A."}</p>
                <p>Network: {networkCode || "N.A."}</p>
                {instruction && <p className="instruction">Instruction: {instruction}</p>}
                {errorMsg && <p className="error">Error: {typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)}</p>}
              </div>
            </div>
          )}
        </div>

        {/* debug output */}
        {lastResponse && (
          <pre style={{ textAlign: "left", maxWidth: 720, margin: "12px auto", padding: 8, background: "#fff6f0", borderRadius: 6, overflowX: "auto" }}>
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        )}
      </div>
    );
  }
}

export default NetsQrSampleLayout;