const fs = require('fs');
const path = 'd:/infinite_ERP/frontend/src/components/prints/FabricBillPrint.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

let start_idx = -1;
let end_idx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'return (') {
    start_idx = i;
    break;
  }
}

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === ');') {
    end_idx = i;
    break;
  }
}

const original_return = lines.slice(start_idx + 1, end_idx);
const indented_original = original_return.map(line => line.trim().length > 0 ? '        ' + line : line);

let new_return = `    const itemsPerPageDC = 8;
    const itemsDC = data?.details || [];
    const pagesDC = [];
    
    for (let i = 0; i < itemsDC.length; i += itemsPerPageDC) {
      const pageItems = itemsDC.slice(i, i + itemsPerPageDC);
      const emptyRows = Array(itemsPerPageDC - pageItems.length).fill(null);
      pagesDC.push({ items: pageItems, emptyRows });
    }

    const totalRowsQuot = 5;
    const emptyRowsCountQuot = totalRowsQuot - (data?.details?.length || 0);
    const emptyRowsQuot = Array(emptyRowsCountQuot > 0 ? emptyRowsCountQuot : 0).fill(null);

    return (
      <div ref={ref}>
        {printType === "DC" && (
          <div style={{ fontFamily: 'Arial, sans-serif' }} data-print-content>
            <style>{\`
              @media print {
                @page { margin: 10mm; size: A5; }
                body { margin: 0; }
                nav, .ant-layout-header, .page-header { display: none !important; }
              }
              @page { size: auto; margin: 0mm; }
              .page-container { padding: 10px; page-break-after: always; }
              .page-container:last-child { page-break-after: auto; }
              .original-label { text-align: right; font-size: 9px; font-weight: bold; margin-bottom: 2px; }
              .print-container { width: 100%; border: 2px solid #000; }
              .header-section { display: flex; border-bottom: 2px solid #000; }
              .header-left { flex: 1; padding: 6px; border-right: 2px solid #000; }
              .header-right { width: 250px; padding: 6px; }
              .company-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
              .company-details { font-size: 9px; line-height: 1.2; }
              .delivery-note-title { font-size: 12px; font-weight: bold; text-align: center; margin-bottom: 4px; padding-bottom: 2px; text-decoration: underline; }
              .dc-details { font-size: 9px; }
              .doc-info-row { display: flex; margin-bottom: 1px; }
              .doc-info-row strong { display: inline-block; width: 80px; }
              .party-section { display: flex; border-bottom: 2px solid #000; }
              .party-left { flex: 1; padding: 6px; border-right: 2px solid #000; }
              .party-right { width: 250px; padding: 6px; }
              .party-label { font-size: 9px; font-weight: bold; margin-bottom: 2px; }
              .party-details { font-size: 9px; line-height: 1.2; }
              .details-table { width: 100%; border-collapse: collapse; }
              .details-table th, .details-table td { border: 1px solid #000; padding: 2px 3px; font-size: 9px; line-height: 1.1; }
              .details-table th { font-weight: bold; text-align: center; }
              .details-table td { text-align: center; vertical-align: top; }
              .details-table tbody tr { height: 20px; }
              .details-table tbody tr td { border-top: none; border-bottom: none; }
              .details-table tbody tr:first-child td { border-top: 1px solid #000; }
              .details-table tbody tr:last-child td { border-bottom: 1px solid #000; }
              .text-left { text-align: left !important; }
              .total-row { font-weight: bold; }
              .footer-section { display: flex; border-top: 2px solid #000; min-height: 50px; }
              .footer-col { flex: 1; text-align: center; font-size: 9px; padding: 6px; display: flex; align-items: flex-end; justify-content: center; }
            \`}</style>
            
            {pagesDC.map((page, pageIndex) => (
              <div key={pageIndex} className="page-container">
                <div className="original-label">(ORIGINAL)</div>
                <div className="print-container">
                  <div className="header-section">
                    <div className="header-left">
                      <div className="company-name">{concernData?.partyName || ''}</div>
                      <div className="company-details">
                        {concernData?.address1 && concernData?.address2 && <>{concernData.address1}, {concernData.address2}<br /></>}
                        {!concernData?.address2 && concernData?.address1 && <>{concernData.address1}<br /></>}
                        {concernData?.address2 && !concernData?.address1 && <>{concernData.address2}<br /></>}
                        {[concernData?.address3, concernData?.address4, concernData?.district].filter(Boolean).join(', ')}{[concernData?.address3, concernData?.address4, concernData?.district].filter(Boolean).length > 0 && <br />}
                        {concernData?.phoneNo && <>Phone No: {concernData.phoneNo}</>}{concernData?.phoneNo && (concernData?.mobileNo || concernData?.email) && <>, </>}
                        {concernData?.mobileNo && <>Mobile No: {concernData.mobileNo}</>}{concernData?.mobileNo && concernData?.email && <>, </>}
                        {concernData?.email && <>Mail Id: {concernData.email}</>}
                        {(concernData?.phoneNo || concernData?.mobileNo || concernData?.email) && <br />}
                        {concernData?.gstNo && <><strong>GST No.: {concernData.gstNo}</strong></>}
                      </div>
                    </div>
                    <div className="header-right">
                      <div className="delivery-note-title">DELIVERY CHALLAN</div>
                      <div className="dc-details">
                        <div className="doc-info-row"><strong>DC No</strong> : {data?.billNo || ''}</div>
                        <div className="doc-info-row"><strong>DC Date</strong> : {data?.billDate ? dayjs(data.billDate).format('DD-MMM-YYYY') : ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="party-section">
                    <div className="party-left">
                      <div className="party-label">To M/s.</div>
                      <div className="party-details">
                        <strong>{partyData?.partyName || ''}</strong><br />
                        {partyData?.address1 && partyData?.address2 && <>{partyData.address1}, {partyData.address2}<br /></>}
                        {!partyData?.address2 && partyData?.address1 && <>{partyData.address1}<br /></>}
                        {partyData?.address2 && !partyData?.address1 && <>{partyData.address2}<br /></>}
                        {[partyData?.address3, partyData?.address4, partyData?.district].filter(Boolean).join(', ')}{[partyData?.address3, partyData?.address4, partyData?.district].filter(Boolean).length > 0 && <br />}
                        {partyData?.phoneNo && <>Phone No: {partyData.phoneNo}</>}{partyData?.phoneNo && (partyData?.mobileNo || partyData?.email) && <>, </>}
                        {partyData?.mobileNo && <>Mobile No: {partyData.mobileNo}</>}{partyData?.mobileNo && partyData?.email && <>, </>}
                        {partyData?.email && <>Mail Id: {partyData.email}</>}
                        {(partyData?.phoneNo || partyData?.mobileNo || partyData?.email) && <br />}
                        {partyData?.gstNo && <><strong>GST No.: {partyData.gstNo}</strong></>}
                      </div>
                    </div>
                    <div className="party-right">
                      <div className="party-label">Invoice To</div>
                      <div className="party-details">
                        <strong>{invoiceToData?.partyName || ''}</strong><br />
                        {invoiceToData?.address1 && invoiceToData?.address2 && <>{invoiceToData.address1}, {invoiceToData.address2}<br /></>}
                        {!invoiceToData?.address2 && invoiceToData?.address1 && <>{invoiceToData.address1}<br /></>}
                        {invoiceToData?.address2 && !invoiceToData?.address1 && <>{invoiceToData.address2}<br /></>}
                        {[invoiceToData?.address3, invoiceToData?.address4, invoiceToData?.district].filter(Boolean).join(', ')}{[invoiceToData?.address3, invoiceToData?.address4, invoiceToData?.district].filter(Boolean).length > 0 && <br />}
                      </div>
                    </div>
                  </div>

                  <table className="details-table">
                    <thead>
                      <tr>
                        <th style={{ width: '15%' }}>Dc Date</th>
                        <th style={{ width: '20%' }}>Dc No</th>
                        <th style={{ width: '20%' }}>PDC No</th>
                        <th style={{ width: '25%' }}>Process</th>
                        <th style={{ width: '10%' }}>Roll</th>
                        <th style={{ width: '10%' }}>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.dcDate ? dayjs(item.dcDate).format('DD/MM/YYYY') : ''}</td>
                          <td>{item.dcNo || ''}</td>
                          <td>{item.pdcNo || ''}</td>
                          <td className="text-left">{item.process || item.processList || 'Fabric Delivery'}</td>
                          <td>{item.rolls || 0}</td>
                          <td>{Number(item.weight || 0).toFixed(3)}</td>
                        </tr>
                      ))}
                      {page.emptyRows.map((_, index) => (
                        <tr key={\`empty-\${index}\`}>
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
                        <td style={{ width: '80%', border: 'none', borderLeft: '1px solid #000', textAlign: 'right', paddingRight: '10px', fontSize: '9px' }}>Total</td>
                        <td style={{ width: '10%', textAlign: 'center', borderLeft: '1px solid #000', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                          {page.items.reduce((sum, item) => sum + (parseFloat(item.rolls) || 0), 0)}
                        </td>
                        <td style={{ width: '10%', textAlign: 'center', borderTop: '1px solid #000', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>
                          {Number(page.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0)).toFixed(3)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="footer-section">
                    <div className="footer-col">
                      <div>
                        <strong>Received By</strong>
                      </div>
                    </div>
                    <div className="footer-col">
                      <div><strong>Prepared By</strong></div>
                    </div>
                    <div className="footer-col">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <strong>For {concernData?.partyName || ''}</strong>
                        <strong>Authorised Signature</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {printType === "Quotation" && (
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }} data-print-content>
            <style>{\`
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
            \`}</style>
            <div className="print-title">QUOTATION</div>
            <div className="print-container">
              <div className="company-section">
                <div className="company-name">{concernData?.partyName || ''}</div>
                <div className="company-details">
                  {concernData?.address1 && concernData?.address2 && <>{concernData.address1}, {concernData.address2}<br /></>}
                  {!concernData?.address2 && concernData?.address1 && <>{concernData.address1}<br /></>}
                  {concernData?.address2 && !concernData?.address1 && <>{concernData.address2}<br /></>}
                  {[concernData?.address3, concernData?.address4, concernData?.district].filter(Boolean).join(', ')}{[concernData?.address3, concernData?.address4, concernData?.district].filter(Boolean).length > 0 && <br />}
                  {concernData?.phoneNo && <>Phone No: {concernData.phoneNo}</>}{concernData?.phoneNo && (concernData?.mobileNo || concernData?.email) && <>, </>}
                  {concernData?.mobileNo && <>Mobile No: {concernData.mobileNo}</>}{concernData?.mobileNo && concernData?.email && <>, </>}
                  {concernData?.email && <>Mail Id: {concernData.email}</>}
                  {(concernData?.phoneNo || concernData?.mobileNo || concernData?.email) && <br />}
                  {concernData?.gstNo && <><strong>GST No.: {concernData.gstNo}</strong></>}
                </div>
              </div>

              <div className="party-section">
                <div className="party-left">
                  <div className="party-label">To M/s.</div>
                  <div className="party-details">
                    <strong>{partyData?.partyName || ''}</strong><br />
                    {partyData?.address1 && partyData?.address2 && <>{partyData.address1}, {partyData.address2}<br /></>}
                    {!partyData?.address2 && partyData?.address1 && <>{partyData.address1}<br /></>}
                    {partyData?.address2 && !partyData?.address1 && <>{partyData.address2}<br /></>}
                    {[partyData?.address3, partyData?.address4, partyData?.district].filter(Boolean).join(', ')}{[partyData?.address3, partyData?.address4, partyData?.district].filter(Boolean).length > 0 && <br />}
                    {partyData?.phoneNo && <>Phone No: {partyData.phoneNo}</>}{partyData?.phoneNo && (partyData?.mobileNo || partyData?.email) && <>, </>}
                    {partyData?.mobileNo && <>Mobile No: {partyData.mobileNo}</>}{partyData?.mobileNo && partyData?.email && <>, </>}
                    {partyData?.email && <>Mail Id: {partyData.email}</>}
                    {(partyData?.phoneNo || partyData?.mobileNo || partyData?.email) && <br />}
                    {partyData?.gstNo && <><strong>GST No.: {partyData.gstNo}</strong></>}
                  </div>
                </div>
                <div className="party-right">
                  <div className="party-details">
                    <strong>Quot No :</strong> {data?.billNo || ''}<br /><br />
                    <strong>Quot Date :</strong> {data?.billDate ? dayjs(data.billDate).format('DD/MM/YYYY') : ''}
                  </div>
                </div>
              </div>

              <table className="details-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>S.No</th>
                    <th>Dc Date</th>
                    <th>Dc No</th>
                    <th>Process</th>
                    <th>Roll</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.details?.map((detail, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{detail.dcDate ? dayjs(detail.dcDate).format('DD/MM/YYYY') : ''}</td>
                      <td>{detail.dcNo || ''}</td>
                      <td className="text-left">{detail.process || detail.processList || 'Fabric Delivery'}</td>
                      <td>{detail.rolls || 0}</td>
                      <td>{Number(detail.weight || 0).toFixed(3)}</td>
                      <td>{Number(detail.rate || 0).toFixed(2)}</td>
                      <td>{Number(detail.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {emptyRowsQuot.map((_, index) => (
                    <tr key={\`empty-\${index}\`} className="empty-row">
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
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

              <div className="payment-section">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '60%' }}>
                    <strong>Amount in Words:</strong><br />
                    {numberToWords(Number(data?.netAmount || 0))}
                  </div>
                  <div style={{ width: '40%' }}>
                    <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'right', paddingRight: '10px', paddingBottom: '3px' }}>Total Amount :</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(data?.totalAmount || 0).toFixed(2)}</td>
                        </tr>
                        {(Number(data?.noOfScreen || 0) > 0 || Number(data?.screenAmount || 0) > 0) && (
                          <tr>
                            <td style={{ textAlign: 'right', paddingRight: '10px', paddingBottom: '3px' }}>Screen Amount :</td>
                            <td style={{ textAlign: 'right' }}>{Number(data?.screenAmount || 0).toFixed(2)}</td>
                          </tr>
                        )}
                        {data?.taxes?.map((tax, index) => {
                          const taxName = gstMasters?.find((g) => g.id === tax.taxName)?.taxName || tax.taxName;
                          return (
                            <tr key={index}>
                              <td style={{ textAlign: 'right', paddingRight: '10px', paddingBottom: '3px' }}>{taxName} :</td>
                              <td style={{ textAlign: 'right' }}>{Number(tax.taxAmount || 0).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td style={{ textAlign: 'right', paddingRight: '10px', paddingBottom: '3px' }}>Round Off :</td>
                          <td style={{ textAlign: 'right' }}>{Number(data?.roundOff || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'right', paddingRight: '10px', paddingTop: '5px', borderTop: '1px solid black', fontWeight: 'bold', fontSize: '11px' }}>Net Amount :</td>
                          <td style={{ textAlign: 'right', paddingTop: '5px', borderTop: '1px solid black', fontWeight: 'bold', fontSize: '11px' }}>{Number(data?.netAmount || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
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
                    <strong>For {concernData?.partyName || ''}</strong>
                    <strong>Authorised Signatory</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(printType !== "DC" && printType !== "Quotation") && (
\` + "\n" + indented_original.join('\n') + "\n" + \`
        )}
      </div>
    );
\`;

const new_lines = [...lines.slice(0, start_idx), new_return, ...lines.slice(end_idx + 1)];
fs.writeFileSync(path, new_lines.join('\\n'), 'utf8');
console.log('Successfully updated FabricBillPrint.jsx');
