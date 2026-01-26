import React, { Component } from "react";
import { useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import commonConfigs from "../config";
import axios from "axios";
import { EventSourcePolyfill } from "event-source-polyfill";
import "../NetsQrSamplePage.css";

class NetsQrSampleLayout extends Component {
  constructor(props) {
    super(props);
    const passedAmount = this.props.location?.state?.totalAmount;
    const order = this.props.location?.state?.order;
    this.state = {
      convertTime: {},
      secondsNetsTimeout: 300,
      amount: parseFloat(passedAmount).toFixed(2),
      order: order,
      txnId: "sandbox_nets|m|8ff8e5b6-d43e-4786-8ac5-7accf8c5bd9b",
      mobile: "",
      netsQrPayment: null,
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
      isLoading: false,
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
      .catch(() => {});

    import("../assets/netsQrLogo.png")
      .then((mod) => this.setState({ logo: mod.default }))
      .catch(() => {});
  }

  async requestNets(amount, txnId, mobile) {
    try {
      this.setState({
        netsQrGenerate: true,
        netsQrPayment: null,
        errorMsg: "",
        lastResponse: null,
        isLoading: true,
      });

      const body = {
        txn_id: txnId,
        amt_in_dollars: amount,
        notify_mobile: mobile,
      };
      console.info("NETS request body:", body);

      const res = await axios.post(
        commonConfigs.apiUrls.requestNetsApi(),
        body,
        { headers: commonConfigs.apiHeader, timeout: 15000 }
      );

      console.info("NETS response:", res);
      const resData = res.data?.result?.data ?? res.data;
      this.setState({ lastResponse: res.data });

      if (
        resData &&
        resData.response_code === "00" &&
        resData.txn_status === 1 &&
        resData.qr_code
      ) {
        localStorage.setItem("txnRetrievalRef", resData.txn_retrieval_ref);
        this.startNetsTimer();
        this.setState({
          netsQrResponseCode: resData.response_code,
          netsQrPayment: "data:image/png;base64," + resData.qr_code,
          netsQrRetrievalRef: resData.txn_retrieval_ref,
          networkCode: resData.network_status,
          openApiPaasTxnStatus: resData.txn_status,
          errorMsg: "",
          isLoading: false,
        });
        this.webhookNets();
      } else {
        this.setState({
          netsQrResponseCode: resData?.response_code ?? "N/A",
          netsQrPayment: null,
          instruction:
            resData?.network_status === 0 ? resData?.instruction : "",
          errorMsg:
            resData?.message ||
            resData?.error ||
            "Transaction failed — see details below.",
          networkCode: resData?.network_status,
          openApiPaasTxnStatus: resData?.txn_status,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("requestNets error", err);
      const status = err?.response?.status;
      const body =
        err?.response?.data ?? err?.message ?? "Network or server error";
      this.setState({
        netsQrGenerate: true,
        netsQrPayment: null,
        errorMsg: `HTTP ${status || "ERR"} — ${
          typeof body === "string" ? body : JSON.stringify(body)
        }`,
        lastResponse: body,
        isLoading: false,
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
          if (
            data.message === "QR code scanned" &&
            data.response_code === "00"
          ) {
            if (this.s2sNetsTxnStatus) this.s2sNetsTxnStatus.close();
            window.location.href = `/nets-qr/success?orderId=${
              this.state.order?.orderId || ""
            }`;
          } else if (data.message === "Timeout") {
            if (this.s2sNetsTxnStatus) this.s2sNetsTxnStatus.close();
            this.queryNets();
          } else {
            this.setState({ lastResponse: data });
          }
        } catch (e) {
          console.warn("Malformed SSE message", e);
        }
      });

      this.s2sNetsTxnStatus.addEventListener("error", (err) => {
        console.error("SSE error", err);
        this.setState({
          errorMsg:
            "SSE connection error (webhook); server may not support SSE.",
        });
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
          window.location.href = `/nets-qr/success?orderId=${
            this.state.order?.orderId || ""
          }`;
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
      try {
        this.s2sNetsTxnStatus.close();
      } catch (e) {}
    }
    window.location.href = "/cart";
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
      isLoading,
      amount,
    } = this.state;

    const timerText =
      secondsNetsTimeout > 0
        ? `${convertTime.m || 0}m : ${String(convertTime.s || 0).padStart(
            2,
            "0"
          )}s`
        : "00:00";

    const progressPercent = (secondsNetsTimeout / 300) * 100;

    return (
      <div className="nets-qr-container">
        {infoImage && (
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img
              src={infoImage}
              alt="NETS Info"
              style={{ maxWidth: 360, height: "auto", borderRadius: 12 }}
            />
          </div>
        )}

        {logo && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src={logo}
              alt="NETS Logo"
              style={{ maxWidth: 380, width: "100%", height: "auto" }}
            />
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

          <Button
            variant="outlined"
            color="error"
            onClick={() => this.handleNetsCancel()}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
        </div>

        <div
          className="nets-qr-area"
          style={{ marginTop: 20, textAlign: "center" }}
        >
          {netsQrGenerate && (
            <div className="nets-qr-display">
              {/* Timer Display */}
              {netsQrPayment && (
                <div className="nets-timer-display">
                  <div className="nets-timer-label">Time Remaining</div>
                  <div className="nets-timer-value">{timerText}</div>
                  <div className="nets-timer-progress">
                    <div
                      className="nets-timer-progress-bar"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* QR Code Display */}
              <div className="nets-qr-img-container">
                {isLoading ? (
                  <div className="nets-qr-loading">
                    <div className="nets-spinner"></div>
                    <div>Generating QR Code...</div>
                  </div>
                ) : netsQrPayment ? (
                  <img
                    src={netsQrPayment}
                    alt="NETS QR"
                    className="nets-qr-img"
                  />
                ) : (
                  <div className="nets-qr-loading">
                    <div style={{ fontSize: 48 }}>⚠️</div>
                    <div style={{ fontWeight: 600 }}>QR Generation Failed</div>
                  </div>
                )}
              </div>

              {/* Transaction Details */}
              {netsQrPayment && (
                <div className="nets-qr-meta">
                  <div className="nets-meta-grid">
                    <div className="nets-meta-item">
                      <div className="nets-meta-label">Amount</div>
                      <div className="nets-meta-value">SGD {amount}</div>
                    </div>
                    <div className="nets-meta-item">
                      <div className="nets-meta-label">Status</div>
                      <div className="nets-meta-value">
                        {netsQrResponseCode === "00"
                          ? "Active"
                          : netsQrResponseCode || "N/A"}
                      </div>
                    </div>
                    <div className="nets-meta-item">
                      <div className="nets-meta-label">Network</div>
                      <div className="nets-meta-value">
                        {networkCode || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: "#f0f9ff",
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  >
                    📱{" "}
                    <strong>Scan with your NETS app to complete payment</strong>
                  </div>
                </div>
              )}

              {/* Instruction */}
              {instruction && <p className="instruction">ℹ️ {instruction}</p>}

              {/* Error Message */}
              {errorMsg && (
                <p className="error">
                  ⚠️{" "}
                  {typeof errorMsg === "string"
                    ? errorMsg
                    : JSON.stringify(errorMsg)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Debug Output */}
        {lastResponse && (
          <pre
            style={{
              textAlign: "left",
              maxWidth: 720,
              margin: "12px auto",
              padding: 8,
              background: "#f9fafb",
              borderRadius: 6,
              overflowX: "auto",
              fontSize: 12,
            }}
          >
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        )}
      </div>
    );
  }
}

export default function NetsQrPageWrapper(props) {
  const location = useLocation();
  return <NetsQrSampleLayout {...props} location={location} />;
}
