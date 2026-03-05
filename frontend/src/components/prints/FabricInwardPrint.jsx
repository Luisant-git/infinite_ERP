import React from 'react';
import dayjs from 'dayjs';

const FabricInwardPrint = React.forwardRef(({ data, fabrics, colors, dias }, ref) => {
  console.log('FabricInwardPrint - enableItemWiseProcess:', data.enableItemWiseProcess);
  console.log('FabricInwardPrint - data:', data);
  
  const getFabricName = (id) => fabrics.find(f => f.id === id)?.masterName || '-';
  const getColorName = (id) => colors.find(c => c.id === id)?.masterName || '-';
  const getDiaName = (id) => dias.find(d => d.id === id)?.masterName || '-';
  
  const itemsPerPage = 5;
  const details = data.details || [];
  const pages = [];
  
  for (let i = 0; i < details.length; i += itemsPerPage) {
    const pageDetails = details.slice(i, i + itemsPerPage);
    const emptyRows = Array(itemsPerPage - pageDetails.length).fill(null);
    pages.push({ details: pageDetails, emptyRows, startIndex: i });
  }

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 10mm; size: A5; }
          body { margin: 0; }
          body::before, body::after { display: none !important; }
        }
        @page { size: auto; margin: 0mm; }
        .page-container { padding: 20px; page-break-after: always; }
        .page-container:last-child { page-break-after: auto; }
        .original-label { text-align: right; font-size: 11px; font-weight: bold; margin-bottom: 5px; }
        .print-container { width: 100%; border: 2px solid #000; }
        .print-header { display: flex; border-bottom: 2px solid #000; }
        .print-header-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .print-header-right { width: 250px; padding: 10px; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .company-details { font-size: 10px; line-height: 1.4; }
        .doc-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 5px; margin-left: -10px; margin-right: -10px; }
        .doc-info { font-size: 10px; }
        .doc-info-row { display: flex; margin-bottom: 2px; }
        .doc-info-row strong { display: inline-block; width: 80px; }
        .party-section { border-bottom: 2px solid #000; display: flex; }
        .party-section-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .party-section-right { width: 250px; padding: 10px; }
        .party-label { font-size: 10px; font-weight: bold; margin-bottom: 3px; }
        .party-name { font-size: 11px; font-weight: bold; margin-bottom: 3px; }
        .party-details { font-size: 10px; line-height: 1.4; }
        .party-info-row { display: flex; justify-content: space-between; margin-top: 5px; }
        .party-info-item { font-size: 10px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th, .details-table td { border-left: 1px solid #000; border-right: 1px solid #000; padding: 4px; font-size: 10px; }
        .details-table th { font-weight: bold; background: #f5f5f5; text-align: center; border-top: 1px solid #000; border-bottom: 1px solid #000; }
        .details-table td { text-align: center; vertical-align: top; }
        .details-table tbody tr:not(.process-row):not(.remarks-row) { height: auto; min-height: 30px; }
        .details-table tbody tr:not(.process-row):not(.remarks-row):first-child td { border-top: 1px solid #000; }
        .details-table tbody tr.empty-row:last-of-type td { border-bottom: 1px solid #000; }
        .process-row td { border-top: 2px solid #000 !important; border-bottom: 1px solid #000 !important; }
        .text-left { text-align: left !important; }
        .process-row { border-top: 2px solid #000; }
        .remarks-row { }
        .remarks-row td { border-left: none !important; border-right: none !important; border-bottom: none !important; white-space: nowrap; }
        .footer-section { display: flex; padding-top: 20px; padding-bottom: 10px; min-height: 60px; align-items: flex-end;}
        .footer-col { flex: 1; text-align: center; font-size: 10px; display: flex; flex-direction: column; justify-content: flex-end; }
      `}</style>

      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="page-container">
          <div className="original-label">ORIGINAL</div>
          <div className="print-container">
        <div className="print-header">
          <div className="print-header-left">
            <div className="company-name">{data.concernName || ''}</div>
            <div className="company-details">
              {data.concernAddr1 && data.concernAddr2 && <>{data.concernAddr1}, {data.concernAddr2}<br /></>}
              {!data.concernAddr2 && data.concernAddr1 && <>{data.concernAddr1}<br /></>}
              {data.concernAddr2 && !data.concernAddr1 && <>{data.concernAddr2}<br /></>}
              {[data.concernAddr3, data.concernAddr4, data.concernDistrict].filter(Boolean).join(', ')}{[data.concernAddr3, data.concernAddr4, data.concernDistrict].filter(Boolean).length > 0 && <br />}
              {[data.concernPhoneNo, data.concernMobileNo, data.concernMailId].filter(Boolean).join(', ')}{[data.concernPhoneNo, data.concernMobileNo, data.concernMailId].filter(Boolean).length > 0 && <br />}
              {data.concernGstNo && <><strong>GST No.: {data.concernGstNo}</strong></>}
            </div>
          </div>
          <div className="print-header-right">
            <div className="doc-title">RECEIVED NOTE</div>
            <div className="doc-info">
              <div className="doc-info-row"><strong>No. :</strong> {data.grnNo}</div>
              <div className="doc-info-row"><strong>Date :</strong> {dayjs(data.grnDate).format('DD/MM/YYYY')}</div>
            </div>
          </div>
        </div>

        <div className="party-section">
          <div className="party-section-left">
            <div className="party-label">To M/s.</div>
            <div className="party-details">
              <strong>{data.partyName || ''}</strong><br />
              {data.address1 && data.address2 && <>{data.address1}, {data.address2}<br /></>}
              {!data.address2 && data.address1 && <>{data.address1}<br /></>}
              {data.address2 && !data.address1 && <>{data.address2}<br /></>}
              {[data.address3, data.address4, data.district].filter(Boolean).join(', ')}{[data.address3, data.address4, data.district].filter(Boolean).length > 0 && <br />}
              {[data.phoneNo, data.mobileNo, data.mailId].filter(Boolean).join(', ')}{[data.phoneNo, data.mobileNo, data.mailId].filter(Boolean).length > 0 && <br />}
              {data.gstNo && <><strong>GST No.: {data.gstNo}</strong></>}
            </div>
          </div>
          <div className="party-section-right">
            <div className="party-details">
              <div className="doc-info-row"><strong>Dy Name :</strong> Direct</div>
              <div className="doc-info-row"><strong>Dyeing DC :</strong> {data.dyeingDcNo || ''}</div>
              <div className="doc-info-row"><strong>Party DC :</strong> {data.pdcNo || ''}</div>
            </div>
            <div className="party-details" style={{ marginTop: '10px', paddingTop: '40px' }}>
              <div className="doc-info-row"><strong>Order No :</strong> {data.orderNo || ''}</div>
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
            {page.details.map((detail, index) => {
              console.log('Detail processes:', detail.processes, 'enableItemWiseProcess:', data.enableItemWiseProcess);
              return (
              <tr key={index}>
                <td>{page.startIndex + index + 1}</td>
                <td className="text-left">
                  {data.enableItemWiseProcess && detail.processes && (
                    <><span style={{ fontSize: '9px', fontStyle: 'italic' }}>{typeof detail.processes === 'string' ? JSON.parse(detail.processes).join(' / ') : detail.processes.join(' / ')}</span><br /></>
                  )}
                  {getFabricName(detail.fabricId)} {detail.designNo ? `/ ${detail.designNo}` : ''}
                </td>
                <td>{getColorName(detail.colorId)}</td>
                <td>{detail.gsm || ''}</td>
                <td>{getDiaName(detail.diaId)}</td>
                <td>{detail.rolls || ''}</td>
                <td>{detail.weight ? `${Number(detail.weight).toFixed(3)} Kgs` : ''}</td>
              </tr>
              );
            })}
            {page.emptyRows.map((_, index) => (
              <tr key={`empty-${index}`} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
            <tr className="process-row">
              <td colSpan="3" className="text-left" style={{ fontWeight: 'bold', padding: '6px' }}>
                {!data.enableItemWiseProcess && (
                  <>Process : {data.processes?.map(p => p.processName).join('+') || ''}</>
                )}
                {data.enableItemWiseProcess && <>&nbsp;</>}
              </td>
              <td colSpan="2" style={{ fontWeight: 'bold' }}>Total</td>
              <td style={{ fontWeight: 'bold' }}>{page.details.reduce((sum, d) => sum + (parseFloat(d.rolls) || 0), 0)}</td>
              <td style={{ fontWeight: 'bold' }}>{page.details.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0).toFixed(3)}</td>
            </tr>
            <tr className="remarks-row">
              <td colSpan="5" className="text-left" style={{ padding: '6px' }}>
                <strong>Remarks :</strong>
              </td>
              <td colSpan="2" className="text-left" style={{ padding: '6px' }}>
                <strong>For {data.concernName || ''}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="footer-section">
          <div className="footer-col">
            <strong>Receiver's Signature</strong>
          </div>
          <div className="footer-col">
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{data.vehicleNo || ''}</div>
            <strong>Vehicle No</strong>
          </div>
          <div className="footer-col">
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{data.returnValue || ''}</div>
            <strong>Return Value</strong>
          </div>
          <div className="footer-col">
            <strong>Authorised Signature</strong>
          </div>
        </div>
      </div>
        </div>
      ))}
    </div>
  );
});

FabricInwardPrint.displayName = 'FabricInwardPrint';

export default FabricInwardPrint;
