import { Component } from "react";
import Button from "@mui/material/Button";
import txnSuccess from "../assets/greenTick.png";

export default class TxnNetsSuccessStatusLayout extends Component {
  constructor(props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);
    this.orderId = urlParams.get("orderId");
  }

  async componentDidMount() {
    // Update payment status to "Paid" when success page loads
    if (this.orderId) {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        const response = await fetch("http://localhost:3000/orders/payment", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: parseInt(this.orderId, 10),
            paymentStatus: "Paid",
          }),
        });

        if (!response.ok) {
          console.error("Failed to update payment status");
        } else {
          console.log("Payment status updated to Paid");
        }
      } catch (error) {
        console.error("Error updating payment status:", error);
      }
    }
  }

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
          <div className="netsQrTxnSuccessStatus" style={{ marginTop: "20px" }}>
            <img
              src={txnSuccess}
              height="auto"
              width="30%"
              alt="Transaction Success"
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
              PAYMENT SUCCESSFUL! 🎉
            </h2>
            {this.orderId && (
              <p
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  marginBottom: "24px",
                }}
              >
                Order ID: <strong>{this.orderId}</strong>
              </p>
            )}
            <div
              className="button"
              id="btnSuccess"
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
                  backgroundColor: "#10b981",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  textDecoration: "none",
                  height: "50px",
                  textTransform: "none",
                }}
                onClick={() => (window.location.href = "/profile")}
              >
                View My Orders
              </Button>
              <Button
                variant="outlined"
                sx={{ width: 300 }}
                style={{
                  borderColor: "#10b981",
                  color: "#10b981",
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
