import React from 'react';
import dayjs from 'dayjs';

const FabricInwardPrint = React.forwardRef(({ data, fabrics, colors, dias }, ref) => {
  const getFabricName = (id) => fabrics.find(f => f.id === id)?.masterName || '-';
  const getColorName = (id) => colors.find(c => c.id === id)?.masterName || '-';
  const getDiaName = (id) => dias.find(d => d.id === id)?.masterName || '-';

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4; }
          body { margin: 0; }
          body::before, body::after { display: none !important; }
          @page { margin: 0; }
        }
        .original-label { text-align: right; font-size: 11px; font-weight: bold; margin-bottom: 5px; }
        .print-container { width: 100%; border: 2px solid #000; }
        .print-header { display: flex; border-bottom: 2px solid #000; }
        .print-header-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .print-header-right { width: 250px; padding: 10px; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .company-details { font-size: 10px; line-height: 1.4; }
        .doc-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 5px; }
        .doc-info { font-size: 10px; }
        .party-section { border-bottom: 2px solid #000; display: flex; }
        .party-section-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .party-section-right { width: 250px; padding: 10px; }
        .party-label { font-size: 10px; font-weight: bold; margin-bottom: 3px; }
        .party-name { font-size: 11px; font-weight: bold; margin-bottom: 3px; }
        .party-details { font-size: 10px; line-height: 1.4; }
        .party-info-row { display: flex; justify-content: space-between; margin-top: 5px; }
        .party-info-item { font-size: 10px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th, .details-table td { border: 1px solid #000; padding: 4px; font-size: 10px; }
        .details-table th { font-weight: bold; background: #f5f5f5; text-align: center; }
        .details-table td { text-align: center; vertical-align: top; }
        .details-table tbody tr:not(.process-row):not(.remarks-row) { height: 120px; }
        .text-left { text-align: left !important; }
        .process-row { border-top: 2px solid #000; }
        .remarks-row { }
        .remarks-row td { border-left: none !important; border-right: none !important; border-bottom: none !important; white-space: nowrap; }
        .footer-section { display: flex; padding-top: 20px; padding-bottom: 10px;}
        .footer-col { flex: 1; text-align: center; font-size: 10px; }
      `}</style>

      <div className="original-label">ORIGINAL</div>
      <div className="print-container">
        <div className="print-header">
          <div className="print-header-left">
            <div className="company-name">ARUVIE PROCESSING MILLS</div>
            <div className="company-details">
              3/571,S.Periyapalayam,Uthukuli Main Road,<br />
              Tirupur-7<br />
              Phone No.-9600554467,9842823550<br />
              GST No.: 33AAHPU0602R1ZG
            </div>
          </div>
          <div className="print-header-right">
            <div className="doc-title">INWARD NOTE</div>
            <div className="doc-info">
              <strong>No. :</strong> {data.grnNo}<br />
              <strong>Date :</strong> {dayjs(data.grnDate).format('DD/MM/YYYY')}
            </div>
          </div>
        </div>

        <div className="party-section">
          <div className="party-section-left">
            <div className="party-label">To M/s.</div>
            <div className="party-name">M/s. {data.partyName || ''}</div>
            <div className="party-details">
              {data.address1 && <>{data.address1}<br /></>}
              {data.address2 && <>{data.address2}<br /></>}
              {data.address3 && <>{data.address3}<br /></>}
              {data.address4 && <>{data.address4}<br /></>}
              {[data.district, data.state, data.pincode].filter(Boolean).join(', ')}
            </div>
          </div>
          <div className="party-section-right">
            <div className="party-details">
              <strong>Dy Name : Direct</strong><br />
              <strong>Dyeing DC :</strong> {data.dyeingDcNo || ''}<br />
              <strong>Party DC :</strong> {data.pdcNo || ''}
            </div>
            <div className="party-details" style={{ marginTop: '10px', paddingTop: '40px' }}>
              <strong>Order No :</strong> {data.orderNo || ''}
            </div>
          </div>
        </div>

        <table className="details-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>S.No.</th>
              <th>Fabric / Design</th>
              <th style={{ width: '100px' }}>Color</th>
              <th style={{ width: '60px' }}>GSM</th>
              <th style={{ width: '50px' }}>Dia</th>
              <th style={{ width: '50px' }}>Rolls</th>
              <th style={{ width: '100px' }}>Weight</th>
            </tr>
          </thead>
          <tbody>
            {data.details?.map((detail, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td className="text-left">{getFabricName(detail.fabricId)} {detail.designNo ? `/ ${detail.designNo}` : ''}</td>
                <td>{getColorName(detail.colorId)}</td>
                <td>{detail.gsm || ''}</td>
                <td>{getDiaName(detail.diaId)}</td>
                <td>{detail.rolls || ''}</td>
                <td>{detail.weight ? `${Number(detail.weight).toFixed(3)} Kgs` : ''}</td>
              </tr>
            ))}
            <tr className="process-row">
              <td colSpan="3" className="text-left" style={{ fontWeight: 'bold', padding: '6px' }}>
                Process : {data.processes?.map(p => p.processName).join('+') || ''}
              </td>
              <td colSpan="2" style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>{data.totalRolls || 12}</td>
              <td style={{ fontWeight: 'bold' }}>{Number(data.totalQty || 234.200).toFixed(3)}</td>
            </tr>
            <tr className="remarks-row">
              <td colSpan="5" className="text-left" style={{ padding: '6px' }}>
                <strong>Remarks :</strong>
              </td>
              <td colSpan="2" className="text-left" style={{ padding: '6px' }}>
                <strong>For ARUVIE PROCESSING MILLS</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="footer-section">
          <div className="footer-col">
            <strong>Receiver's Signature</strong>
          </div>
          <div className="footer-col">
            <strong>Vehicle No</strong>
          </div>
          <div className="footer-col">
            <strong>Checked By</strong>
          </div>
          <div className="footer-col">
            <strong>Authorised Signature</strong>
          </div>
        </div>
      </div>
    </div>
  );
});

FabricInwardPrint.displayName = 'FabricInwardPrint';

export default FabricInwardPrint;
