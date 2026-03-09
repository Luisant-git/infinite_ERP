import React from 'react';
import dayjs from 'dayjs';

const RateQuotationPrint = React.forwardRef(({ data, processes }, ref) => {
  const getProcessName = (id) => processes.find(p => p.id === id)?.processName || '-';
  
  // Always show 5 rows total
  const totalRows = 5;
  const emptyRowsCount = totalRows - (data.details?.length || 0);
  const emptyRows = Array(emptyRowsCount > 0 ? emptyRowsCount : 0).fill(null);

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4; }
          body { margin: 0; }
          body::before, body::after { display: none !important; }
          @page { margin: 0; }
        }
        @page { size: auto; margin: 0mm; }
        .print-title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 5px; }
        .print-container { width: 100%; border: 2px solid #000; }
        .company-section { text-align: center; padding: 10px; border-bottom: 2px solid #000; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .company-details { font-size: 10px; line-height: 1.4; }
        .party-section { display: flex; border-bottom: 2px solid #000; }
        .party-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .party-right { width: 250px; padding: 10px; }
        .party-label { font-size: 10px; font-weight: bold; margin-bottom: 3px; }
        .party-details { font-size: 10px; line-height: 1.4; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th, .details-table td { border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px; font-size: 10px; }
        .details-table th { font-weight: bold; background: #f5f5f5; text-align: center; border-top: 1px solid #000; border-bottom: 1px solid #000; }
        .details-table td { text-align: center; vertical-align: top; }
        .details-table tbody tr { height: auto; min-height: 30px; }
        .details-table tbody tr:first-child td { border-top: 1px solid #000; }
        .details-table tbody tr:last-child td { border-bottom: 1px solid #000; }
        .text-left { text-align: left !important; }
        .payment-section { padding: 10px; font-size: 10px; min-height: 100px; border-left: none !important; border-right: none !important; border-bottom: none !important; }
        .footer-section { display: flex; border-top: 2px solid #000; min-height: 60px; }
        .footer-col { flex: 1; text-align: center; font-size: 10px; padding: 10px; border-right: 1px solid #000; display: flex; align-items: flex-end; justify-content: center; }
        .footer-col:last-child { border-right: none; }
      `}</style>

      <div className="print-title">RATE QUOTATION</div>
      <div className="print-container">
        
        <div className="company-section">
          <div className="company-name">{data.concernName || ''}</div>
          <div className="company-details">
            {data.concernAddr1 && data.concernAddr2 && <>{data.concernAddr1}, {data.concernAddr2}<br /></>}
            {!data.concernAddr2 && data.concernAddr1 && <>{data.concernAddr1}<br /></>}
            {data.concernAddr2 && !data.concernAddr1 && <>{data.concernAddr2}<br /></>}
            {[data.concernAddr3, data.concernAddr4, data.concernDistrict].filter(Boolean).join(', ')}{[data.concernAddr3, data.concernAddr4, data.concernDistrict].filter(Boolean).length > 0 && <br />}
            {data.concernPhoneNo && <>Phone No: {data.concernPhoneNo}</>}{data.concernPhoneNo && (data.concernMobileNo || data.concernMailId) && <>, </>}
            {data.concernMobileNo && <>Mobile No: {data.concernMobileNo}</>}{data.concernMobileNo && data.concernMailId && <>, </>}
            {data.concernMailId && <>Mail Id: {data.concernMailId}</>}
            {(data.concernPhoneNo || data.concernMobileNo || data.concernMailId) && <br />}
            {data.concernGstNo && <><strong>GST No.: {data.concernGstNo}</strong></>}
          </div>
        </div>

        <div className="party-section">
          <div className="party-left">
            <div className="party-label">To M/s.</div>
            <div className="party-details">
              <strong>{data.partyName || ''}</strong><br />
              {data.address1 && data.address2 && <>{data.address1}, {data.address2}<br /></>}
              {!data.address2 && data.address1 && <>{data.address1}<br /></>}
              {data.address2 && !data.address1 && <>{data.address2}<br /></>}
              {[data.address3, data.address4, data.district].filter(Boolean).join(', ')}{[data.address3, data.address4, data.district].filter(Boolean).length > 0 && <br />}
              {data.phoneNo && <>Phone No: {data.phoneNo}</>}{data.phoneNo && (data.mobileNo || data.mailId) && <>, </>}
              {data.mobileNo && <>Mobile No: {data.mobileNo}</>}{data.mobileNo && data.mailId && <>, </>}
              {data.mailId && <>Mail Id: {data.mailId}</>}
              {(data.phoneNo || data.mobileNo || data.mailId) && <br />}
              {data.gstNo && <><strong>GST No.: {data.gstNo}</strong></>}
            </div>
          </div>
          <div className="party-right">
            <div className="party-details">
              <strong>Quot No :</strong> {data.quotNo}<br /><br />
              <strong>Quot Date :</strong> {dayjs(data.quotDate).format('DD/MM/YYYY')}
            </div>
          </div>
        </div>

        <table className="details-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>S.No</th>
              <th>Process</th>
              <th style={{ width: '100px' }}>Rate/Kgs</th>
              <th style={{ width: '120px' }}>Sample Rate</th>
              <th style={{ width: '150px' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.details?.map((detail, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td className="text-left">{getProcessName(detail.processId)}</td>
                <td>{Number(detail.rate || 0).toFixed(2)}</td>
                <td>{Number(detail.confirmRate || 0).toFixed(2)}</td>
                <td className="text-left">{detail.remarks || ''}</td>
              </tr>
            ))}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="payment-section">
          <strong>PAYMENT TERMS:</strong><br />
          {data.paymentTerms || ''}
        </div>

        <div className="footer-section">
          <div className="footer-col">
            <div><strong>Receiver's Signatory</strong></div>
          </div>
          <div className="footer-col">
            <div><strong>Prepared By</strong></div>
          </div>
          <div className="footer-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <strong>For {data.concernName || ''}</strong>
              <strong>Authorised Signatory</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

RateQuotationPrint.displayName = 'RateQuotationPrint';

export default RateQuotationPrint;
