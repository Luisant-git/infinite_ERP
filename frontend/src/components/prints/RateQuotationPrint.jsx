import React from 'react';
import dayjs from 'dayjs';

const RateQuotationPrint = React.forwardRef(({ data, processes }, ref) => {
  const getProcessName = (id) => processes.find(p => p.id === id)?.processName || '-';

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4; }
          body { margin: 0; }
          body::before, body::after { display: none !important; }
          @page { margin: 0; }
        }
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
        .details-table th, .details-table td { border: 1px solid #000; padding: 4px; font-size: 10px; }
        .details-table th { font-weight: bold; background: #f5f5f5; text-align: center; }
        .details-table td { text-align: center; vertical-align: top; }
        .details-table tbody tr { height: 150px; }
        .text-left { text-align: left !important; }
        .payment-section { padding: 10px; font-size: 10px; min-height: 100px; border-left: none !important; border-right: none !important; border-bottom: none !important; }
        .footer-section { display: flex; border-top: 2px solid #000; min-height: 60px; }
        .footer-col { flex: 1; text-align: center; font-size: 10px; padding: 10px; border-right: 1px solid #000; display: flex; align-items: flex-end; justify-content: center; }
        .footer-col:last-child { border-right: none; }
      `}</style>

      <div className="print-title">RATE QUOTATION</div>
      <div className="print-container">
        
        <div className="company-section">
          <div className="company-name">ARUVIE PROCESSING MILLS</div>
          <div className="company-details">
            3/571,S.Periyapalayam,<br />
            Uthukuli Main Road,Tirupur-7<br />
            Mobile Nos : 9600554467,9842823550, E-Mail : accounts@aruvieprocessingmills.in<br />
            State : TAMIL NADU Code : 33<br />
            GST IN :33AAHPU0602R1ZG
          </div>
        </div>

        <div className="party-section">
          <div className="party-left">
            <div className="party-label">To :</div>
            <div className="party-details">
              <strong>M/s.{data.partyName || ''}</strong><br />
              {data.address1 && <>{data.address1}<br /></>}
              {data.address2 && <>{data.address2}<br /></>}
              {data.address3 && <>{data.address3}<br /></>}
              {data.address4 && <>{data.address4}<br /></>}
              {[data.district, data.pincode].filter(Boolean).join(', ')}<br />
              State : {data.state || ''} Code {data.stateCode || ''}<br />
              GST IN : {data.gstNo || ''}
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
              <strong>For ARUVIE PROCESSING MILLS</strong>
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
