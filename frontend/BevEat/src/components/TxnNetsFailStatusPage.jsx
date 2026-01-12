import { Component } from "react";
import Button from "@mui/material/Button";
import txnFail from "../assets/redCross.png";

export default class TxnNetsFailStatusLayout extends Component {
  render() {
    return (
      <div style={{ margin: "50px" }}>
        <div
          className="netsQrPaymentGatewayWebpage"
          style={{
            marginTop: "20px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
          }}
        >
          <div className="netsQrTxnFailStatus" style={{ marginTop: "20px" }}>
            <img
              src={txnFail}
              height="auto"
              width="30%"
              alt="Transaction Fail"
              style={{ marginBottom: "20px" }}
            />
            <h2
              className="text"
              style={{
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "12px",
              }}
            >
              PAYMENT FAILED
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                marginBottom: "24px",
              }}
            >
              We couldn't process your payment. Please try again.
            </p>
            <div
              className="button"
              id="btnFail"
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                sx={{ width: 300 }}
                style={{
                  backgroundColor: "#dc2626",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  textDecoration: "none",
                  height: "50px",
                  textTransform: "none",
                }}
                onClick={() => (window.location.href = "/cart")}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                sx={{ width: 300 }}
                style={{
                  borderColor: "#dc2626",
                  color: "#dc2626",
                  borderWidth: "2px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  textDecoration: "none",
                  height: "50px",
                  textTransform: "none",
                }}
                onClick={() => (window.location.href = "/home")}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
