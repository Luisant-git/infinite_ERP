import React from 'react';
import dayjs from 'dayjs';

const FabricReturnPrint = React.forwardRef(({ data }, ref) => {
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
        .return-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 10px; padding-bottom: 5px; }
        .dc-details { font-size: 10px; }
        .doc-info-row { display: flex; margin-bottom: 2px; }
        .doc-info-row strong { display: inline-block; width: 80px; }
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
        .footer-section { display: flex; border-top: 2px solid #000; }
        .footer-col { flex: 1; text-align: center; font-size: 10px; padding: 10px; border-right: 2px solid #000; display: flex; align-items: flex-end; justify-content: center; }
        .footer-col:last-child { border-right: none; }
      `}</style>

      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="page-container">
          <div className="original-label">(ORIGINAL)</div>

          <div className="print-container">
        <div className="header-section">
          <div className="header-left">
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
          <div className="header-right">
            <div className="return-title">FABRIC RETURN</div>
            <div className="dc-details">
              <div className="doc-info-row"><strong>GRN No :</strong> {data.dcNo || ''}</div>
              <div className="doc-info-row"><strong>DC Date :</strong> {data.dcDate ? dayjs(data.dcDate).format('DD-MMM-YYYY') : ''}</div>
            </div>
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
              {[data.phoneNo, data.mobileNo, data.mailId].filter(Boolean).join(', ')}{[data.phoneNo, data.mobileNo, data.mailId].filter(Boolean).length > 0 && <br />}
              {data.gstNo && <><strong>GST No.: {data.gstNo}</strong></>}
            </div>
          </div>
          <div className="party-right">
            <div className="party-details">
              <div className="doc-info-row"><strong>Inward From :</strong> {data.dyeParty || '-'}</div>
              <div className="doc-info-row"><strong>DC No :</strong> {data.dyeDcNo || ''}</div>
              <div className="doc-info-row"><strong>Party DC No :</strong> {data.pdcNo || ''}</div>
            </div>
          </div>
        </div>

        <div className="order-section">
          <div className="order-left">
            <strong>Order No &nbsp;:</strong> {data.orderNo || ''}
          </div>
          <div className="order-center">
            <strong>Inward No &nbsp;:</strong> {data.inwardNo || ''}
          </div>
          <div className="order-right">
            <strong>Rec Weight &nbsp;:</strong> {data.recWeight || ''}
          </div>
        </div>

        <table className="details-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Fabric</th>
              <th style={{ width: '15%' }}>Color</th>
              <th style={{ width: '10%' }}>Dia</th>
              <th style={{ width: '10%' }}>Rolls</th>
              <th style={{ width: '15%' }}>Weight</th>
              <th>Remarks</th>
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
                <td className="text-left">{item.remarks || ''}</td>
              </tr>
            ))}
            {page.emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                <td>&nbsp;</td>
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
              <td style={{ width: '20%', border: 'none', borderLeft: '1px solid #000' }}>&nbsp;</td>
              <td style={{ width: '15%', border: 'none' }}>&nbsp;</td>
              <td style={{ width: '10%', textAlign: 'center', borderLeft: '1px solid #000', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>Total</td>
              <td style={{ width: '10%', textAlign: 'center', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>{page.items.reduce((sum, item) => sum + (parseFloat(item.rolls) || 0), 0)}</td>
              <td style={{ width: '15%', textAlign: 'center', borderTop: '1px solid #000', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>{page.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(3)}</td>
              <td style={{ border: 'none', borderRight: '1px solid #000' }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <div className="footer-section">
          <div className="footer-col">
            <div><strong>Received By</strong></div>
          </div>
          <div className="footer-col">
            <div><div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{data.vehicleNo || ''}</div><strong>Vehicle No</strong></div>
          </div>
          <div className="footer-col">
            <div><strong>Prepared By</strong></div>
          </div>
          <div className="footer-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <strong>For {data.concernName || ''}</strong>
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

FabricReturnPrint.displayName = 'FabricReturnPrint';

export default FabricReturnPrint;
