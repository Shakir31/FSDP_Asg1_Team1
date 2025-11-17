import { Component } from "react";
import Button from '@mui/material/Button';
import txnFail from '../assets/redCross.png';
export default class TxnNetsFailStatusLayout extends Component {
    render() {
        return (
            <div style={{ margin: '50px' }}>
                <div className="netsQrPaymentGatewayWebpage" style={{ marginTop: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                    <div className="netsQrTxnFailStatus" style={{ marginTop: '20px' }}>
                        <img src={txnFail} height="auto" width="30%" alt="Transaction Fail" />
                        <h2 className="text" style={{ fontSize: '18px' }}>TRANSACTION FAILED</h2>
                        <div className="button" id="btnFail" style={{ marginTop: '20px' }}>
                            <Button variant="contained" sx={{ width: 300 }} style={{ backgroundColor: "dodgerblue", borderRadius: '10px', fontSize: '14px', textDecoration: 'none', height: "50px" }} onClick={() => window.location.href = "/nets-qr"}>
                                    Back to Test Page
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}