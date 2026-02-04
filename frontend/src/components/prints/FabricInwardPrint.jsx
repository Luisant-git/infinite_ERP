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
          @page { margin: 10mm; }
          body { margin: 0; }
          @page { size: auto; margin: 0mm; }
          html { margin: 0px; }
        }
        @media print {
          body::before, body::after { display: none !important; }
          @page { margin: 0; }
        }
        .print-container { width: 100%; border: 2px solid #000; }
        .print-header { display: flex; border-bottom: 2px solid #000; }
        .print-header-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .print-header-right { width: 300px; padding: 10px; }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .company-details { font-size: 11px; line-height: 1.4; }
        .doc-title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 5px; }
        .doc-info { font-size: 11px; }
        .party-section { border-bottom: 2px solid #000; display: flex; }
        .party-section-left { width: calc(100% - 300px); padding: 10px; border-right: 2px solid #000; }
        .party-section-right { width: 300px; padding: 10px; }
        .party-label { font-size: 11px; font-weight: bold; margin-bottom: 5px; }
        .party-details { font-size: 11px; line-height: 1.4; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th, .details-table td { border: 1px solid #000; padding: 5px; font-size: 11px; text-align: center; }
        .details-table th { font-weight: bold; background: #f0f0f0; }
        .footer-section { display: flex; border-top: 2px solid #000; }
        .footer-section-no-border { display: flex; padding: 10px; font-size: 11px; }
        .footer-col { flex: 1; padding: 10px; border-right: 1px solid #000; font-size: 11px; }
        .footer-col:last-child { border-right: none; }
        .signature-line { margin-top: 10px; padding-top: 0px; text-align: center; }
      `}</style>

      <div className="print-container">
        <div className="print-header">
          <div className="print-header-left">
            <div className="company-name">ARUVIE PROCESSING MILLS</div>
            <div className="company-details">
              3/571,S Periyapalayam,Uthukuli Main Road,Tirupur-7<br />
              Phone No.:9600554467,9842823550,<br />
              GST No:33AAHPU0602R1ZG
            </div>
          </div>
          <div className="print-header-right">
            <div className="doc-title">RECEIVED NOTE</div>
            <div className="doc-info">
              <strong>No. :</strong> {data.grnNo}<br />
              <strong>Date :</strong> {dayjs(data.grnDate).format('DD/MM/YYYY')}
            </div>
          </div>
        </div>

        <div className="party-section">
          <div className="party-section-left">
            <div className="party-label">To M/s.</div>
            <div className="party-details">
              <strong>M/s. {data.partyName || '-'}</strong><br />
              {data.partyAddress?.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < data.partyAddress.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="party-section-right">
            <div className="party-details">
              <strong>Dy Name :</strong>{data.dyeingPartyName || 'FRIENDS COLOURS'}<br />
              <strong>Dyeing DC :</strong>{data.dyeingDcNo || '2161'}<br />
              <strong>Party DC :</strong>{data.pdcNo || ''}<br />
              <strong>Order No :</strong>{data.orderNo || ''}
            </div>
          </div>
        </div>

        <table className="details-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>S.No.</th>
              <th>Fabric</th>
              <th>Color</th>
              <th style={{ width: '60px' }}>Dia</th>
              <th style={{ width: '50px' }}>Rolls</th>
              <th style={{ width: '100px' }}>Weight</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.details?.map((detail, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{getFabricName(detail.fabricId)}</td>
                <td>{getColorName(detail.colorId)}</td>
                <td>{getDiaName(detail.diaId)}</td>
                <td>{detail.rolls || '-'}</td>
                <td>{detail.weight ? `${detail.weight} Kgs` : '-'}</td>
                <td>{detail.remarks || ''}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" style={{ textAlign: 'left', fontWeight: 'bold' }}>
                Process : {data.processes?.map(p => p.processName).join(', ') || '-'}
              </td>
              <td style={{ fontWeight: 'bold', textAlign: 'center' }}>Total</td>
              <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{data.totalRolls || 0}</td>
              <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{data.totalQty || 0}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan="2" style={{ padding: '5px', verticalAlign: 'top', textAlign: 'left' }}>
                <strong>Vehicle No :</strong> {data.vehicleNo || ''}
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                  <strong>Receiver's Signatory</strong>
                </div>
              </td>
              <td colSpan="3" style={{ padding: '5px', verticalAlign: 'bottom', textAlign: 'center' }}>
                <div style={{ marginTop: '30px' }}>
                  <strong>Prepared By</strong>
                </div>
              </td>
              <td colSpan="2" style={{ padding: '5px', verticalAlign: 'top', textAlign: 'right' }}>
                <strong>For ARUVIE PROCESSING MILLS</strong>
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                  <strong>Authorised Signatory</strong>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

FabricInwardPrint.displayName = 'FabricInwardPrint';

export default FabricInwardPrint;
