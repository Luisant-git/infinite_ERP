import React from 'react';
import dayjs from 'dayjs';

const PartyLedgerPrint = React.forwardRef(({ data, fromDate, toDate, companyDetails }, ref) => {
    if (!data) return null;

    // Movement Totals calculation
    let totalDebit = Number(data.initialBalance) >= 0 ? Number(data.initialBalance) : 0;
    let totalCredit = Number(data.initialBalance) < 0 ? Math.abs(Number(data.initialBalance)) : 0;
    
    data.ledger?.forEach(l => {
        totalDebit += Number(l.debit || 0);
        totalCredit += Number(l.credit || 0);
    });

    const finalBalance = totalDebit - totalCredit;

    return (
        <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }} data-print-content>
            <style>{`
                @media print {
                    @page { 
                        margin: 0mm; 
                        size: A4; 
                    }
                    body { margin: 0; }
                }
                .ledger-wrapper {
                    border: 1px solid #000;
                    padding: 0;
                    background-color: white;
                    display: flex;
                    flex-direction: column;
                }
                .section-border {
                    border-bottom: 1px solid #000;
                    padding: 8px 10px;
                    text-align: center;
                }
                .concern-section {
                    position: relative;
                    min-height: 80px;
                }
                .logo-container {
                    position: absolute;
                    left: 50px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .logo-container img {
                    width: 70px;
                    height: 70px;
                    object-fit: contain;
                }
                .biz-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; text-transform: uppercase; }
                .biz-details { font-size: 9px; line-height: 1.4; color: #000; }
                
                .party-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
                .party-details { font-size: 9px; line-height: 1.4; color: #000; }
                
                .date-range {
                    color: #C80064;
                    font-weight: bold;
                    font-size: 11px;
                    padding: 4px;
                }
                
                .ledger-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #000;
                }
                .ledger-table th, .ledger-table td {
                    border: 1px solid #000;
                    padding: 4px 8px;
                    font-size: 10px;
                    line-height: 1.2;
                }
                .ledger-table th { font-weight: bold; text-align: center; }
                .val-debit { color: #cc0000; text-align: right; }
                .val-credit { color: #007600; text-align: right; }
                
                .total-row { font-weight: bold; background-color: #fff; }
                .balance-row { font-weight: bold; background-color: #fff; }
                
                .text-red { color: #cc0000; }
                .text-green { color: #007600; }
                .text-bold { font-weight: bold; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
            `}</style>

            <div className="ledger-wrapper">
                {/* 1. Concern Section (Centered with Logo on far left) */}
                <div className="section-border concern-section">
                    {companyDetails?.logo && (
                        <div className="logo-container">
                            <img src={companyDetails.logo} alt="logo" />
                        </div>
                    )}
                    <div className="biz-name">{companyDetails?.partyName || "COMPANY NAME"}</div>
                    <div className="biz-details">
                        {[companyDetails?.address1, companyDetails?.address2, companyDetails?.address3, companyDetails?.address4].filter(Boolean).join(', ')}<br />
                        {[companyDetails?.district, companyDetails?.state, companyDetails?.pincode].filter(Boolean).join(', ')}<br />
                        Phone No.: {[companyDetails?.phoneNo, companyDetails?.mobileNo].filter(Boolean).join(', ')}{companyDetails?.email ? `, E-Mail: ${companyDetails.email}` : ''}<br />
                        <strong>GST No.: {companyDetails?.gstNo || ""}</strong>
                    </div>
                </div>

                {/* 2. Party Section (Centered) */}
                <div className="section-border">
                    <div className="party-name">{data.partyName}</div>
                    <div className="party-details">
                        {data.address && <div>{data.address}</div>}
                        {(data.mobileNo || data.email) && (
                            <div>
                                Phone No.: {[data.phoneNo, data.mobileNo].filter(Boolean).join(', ')}{data.email ? `, E-Mail: ${data.email}` : ''}
                            </div>
                        )}
                        <strong>GST No.: {data.gstNo}</strong>
                    </div>
                </div>

                {/* 3. Date Range (Pink/Red Centered) */}
                <div className="date-range text-center">
                    From {fromDate ? dayjs(fromDate).format('DD-MM-YYYY') : ''} To {toDate ? dayjs(toDate).format('DD-MM-YYYY') : ''}
                </div>

                {/* 4. Ledger Table */}
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>Date</th>
                            <th style={{ width: '15%' }}>Ref No</th>
                            <th style={{ width: '30%' }}>Particulars</th>
                            <th style={{ width: '20%' }} className="text-red">Debit</th>
                            <th style={{ width: '20%' }} className="text-green">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Opening row */}
                        <tr>
                            <td className="text-center">-</td>
                            <td className="text-center">-</td>
                            <td>Opening -</td>
                            <td className="val-debit">{Number(data.initialBalance) >= 0 ? parseFloat(data.initialBalance).toFixed(2) : ''}</td>
                            <td className="val-credit">{Number(data.initialBalance) < 0 ? parseFloat(Math.abs(data.initialBalance)).toFixed(2) : ''}</td>
                        </tr>
                        
                        {/* Transaction rows */}
                        {data.ledger?.map((l, index) => (
                            <tr key={index}>
                                <td className="text-center">{dayjs(l.refDate).format('DD/MM/YYYY')}</td>
                                <td className="text-center">{l.refNo}</td>
                                <td>{l.particulars}</td>
                                <td className="val-debit">{l.debit > 0 ? parseFloat(l.debit).toFixed(2) : ''}</td>
                                <td className="val-credit">{l.credit > 0 ? parseFloat(l.credit).toFixed(2) : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td colSpan={3} className="text-center">Total</td>
                            <td className="val-debit">{totalDebit.toFixed(2)}</td>
                            <td className="val-credit">{totalCredit.toFixed(2)}</td>
                        </tr>
                        <tr className="balance-row">
                            <td colSpan={3} className="text-center">Closing Balance</td>
                            <td className="text-right" colSpan={2}>
                                {finalBalance >= 0 ? (
                                    <span className="text-red">{Math.abs(finalBalance).toFixed(2)}</span>
                                ) : (
                                    <span className="text-green">{Math.abs(finalBalance).toFixed(2)}</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
});

PartyLedgerPrint.displayName = 'PartyLedgerPrint';

export default PartyLedgerPrint;
