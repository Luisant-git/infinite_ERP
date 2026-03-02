import React from 'react';
import dayjs from 'dayjs';

const FabricDCPrint = React.forwardRef(({ data }, ref) => {
  const itemsPerPage = 5;
  const items = data.items || [data];
  const pages = [];
  
  for (let i = 0; i < items.length; i += itemsPerPage) {
    const pageItems = items.slice(i, i + itemsPerPage);
    const emptyRows = Array(itemsPerPage - pageItems.length).fill(null);
    pages.push({ items: pageItems, emptyRows });
  }

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif' }} data-print-content>
      <style>{`
        @media print {
          @page { 
            margin: 10mm; 
            size: A5; 
          }
          body { 
            margin: 0; 
          }
          nav, .ant-layout-header, .page-header {
            display: none !important;
          }
        }
        @page { size: auto; margin: 0mm; }
        .page-container { padding: 20px; page-break-after: always; }
        .page-container:last-child { page-break-after: auto; }
        .original-label { text-align: right; font-size: 10px; font-weight: bold; margin-bottom: 5px; }
        .print-container { width: 100%; border: 2px solid #000; }
        .header-section { display: flex; border-bottom: 2px solid #000; }
        .header-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .header-right { width: 250px; padding: 10px; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .company-details { font-size: 10px; line-height: 1.4; }
        .delivery-note-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 10px; padding-bottom: 5px; text-decoration: underline; }
        .dc-details { font-size: 10px; line-height: 1.6; }
        .party-section { display: flex; border-bottom: 2px solid #000; }
        .party-left { flex: 1; padding: 10px; border-right: 2px solid #000; }
        .party-right { width: 250px; padding: 10px; }
        .party-label { font-size: 10px; font-weight: bold; margin-bottom: 3px; }
        .party-details { font-size: 10px; line-height: 1.4; }
        .order-section { display: flex; border-bottom: 2px solid #000; padding: 8px 10px; font-size: 10px; }
        .order-left { flex: 1; }
        .order-center { flex: 1; text-align: center; }
        .order-right { flex: 1; text-align: right; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th, .details-table td { border: 1px solid #000; padding: 6px; font-size: 10px; }
        .details-table th { font-weight: bold; text-align: center; }
        .details-table td { text-align: center; vertical-align: top; }
        .details-table tbody tr td { border-top: none; border-bottom: none; }
        .details-table tbody tr:first-child td { border-top: 1px solid #000; }
        .details-table tbody tr:last-child td { border-bottom: 1px solid #000; }
        .text-left { text-align: left !important; }
        .total-row { font-weight: bold; }
        .process-section { display: flex; border-top: 2px solid #000; padding: 8px 10px; font-size: 10px; }
        .process-left { flex: 1; }
        .process-right { flex: 1; text-align: right; }
        .footer-section { display: flex; min-height: 80px; border-top: 2px solid #000; }
        .footer-col { flex: 1; text-align: center; font-size: 10px; padding: 15px; border-right: 2px solid #000; display: flex; align-items: flex-end; justify-content: center; }
        .footer-col:last-child { border-right: none; }
      `}</style>

      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="page-container">
          <div className="original-label">(ORIGINAL)</div>

          <div className="print-container">
        <div className="header-section">
          <div className="header-left">
            <div className="company-name">ARUVIE PROCESSING MILLS</div>
            <div className="company-details">
              3/571,S.Periyapalayam,Uthukuli Main Road,<br />
              Tirupur-7<br />
              GST No.:33AAHPU0602R1ZG<br />
              Phone No.:9600554467,9842823550
            </div>
          </div>
          <div className="header-right">
            <div className="delivery-note-title">DELIVERY NOTE</div>
            <div className="dc-details">
              <strong>DC No</strong> &nbsp;&nbsp;: {data.dcNo || ''}<br />
              <strong>DC Date</strong> &nbsp;: {data.dcDate ? dayjs(data.dcDate).format('DD-MMM-YYYY') : ''}
            </div>
          </div>
        </div>

        <div className="party-section">
          <div className="party-left">
            <div className="party-label">To M/s.</div>
            <div className="party-details">
              <strong>{data.partyName || ''}</strong><br />
              {data.address || ''}
            </div>
          </div>
          <div className="party-right">
            <div className="party-details">
              <strong>Dye Party :</strong> {data.dyeParty || '-'}<br />
              <strong>Dye Dc No :</strong> {data.dyeDcNo || ''}<br />
              <strong>PDC No :</strong> {data.pdcNo || ''}
            </div>
          </div>
        </div>

        <div className="order-section">
          <div className="order-left">
            <strong>Order No :</strong> {data.orderNo || ''}
          </div>
          <div className="order-center">
            <strong>Job No :</strong> {data.jobNo || ''}
          </div>
          <div className="order-right">
            <strong>Rec Weight :</strong> {data.recWeight || ''}
          </div>
        </div>

        <table className="details-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Fabric</th>
              <th style={{ width: '12%' }}>Color</th>
              <th style={{ width: '10%' }}>Dia</th>
              <th style={{ width: '10%' }}>Rolls</th>
              <th style={{ width: '12%' }}>Weight</th>
              <th>Previous Dc List</th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((item, index) => (
              <tr key={index}>
                <td className="text-left">{item.fabric || '-'}</td>
                <td className="text-left">{item.color || '-'}</td>
                <td>{item.dia || '-'}</td>
                <td>{item.rolls || ''}</td>
                <td>{item.weight || ''}</td>
                {index === 0 && <td className="text-left" rowSpan={page.items.length + page.emptyRows.length}>&nbsp;</td>}
              </tr>
            ))}
            {page.emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="details-table" style={{ borderTop: 'none' }}>
          <tbody>
            <tr className="total-row">
              <td style={{ width: '15%', border: 'none', borderLeft: '1px solid #000' }}>&nbsp;</td>
              <td style={{ width: '12%', border: 'none' }}>&nbsp;</td>
              <td style={{ width: '10%', textAlign: 'center', borderLeft: '1px solid #000', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>Total</td>
              <td style={{ width: '10%', textAlign: 'center', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>{page.items.reduce((sum, item) => sum + (parseFloat(item.rolls) || 0), 0)}</td>
              <td style={{ width: '12%', textAlign: 'center', borderTop: '1px solid #000', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>{page.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0)}</td>
              <td style={{ border: 'none', borderRight: '1px solid #000' }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <div className="process-section">
          <div className="process-left">
            <strong>Process</strong> &nbsp;&nbsp; {data.process || ''}
          </div>
          <div className="process-right">
            <strong>Vehicle No</strong> &nbsp;&nbsp; {data.vehicleNo || ''}
          </div>
        </div>

        <div style={{ padding: '8px 10px', fontSize: '10px', borderBottom: '2px solid #000' }}>
          <strong>Remarks</strong> &nbsp;&nbsp; {data.remarks || '-'}
        </div>

        <div className="footer-section">
          <div className="footer-col">
            <div><strong>Received By</strong></div>
          </div>
          <div className="footer-col">
            <div><strong>Prepared By</strong></div>
          </div>
          <div className="footer-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
              <strong>For ARUVIE PROCESSING MILLS</strong>
              <strong>Authorised Signature</strong>
            </div>
          </div>
        </div>
      </div>
        </div>
      ))}
    </div>
  );
});

FabricDCPrint.displayName = 'FabricDCPrint';

export default FabricDCPrint;
