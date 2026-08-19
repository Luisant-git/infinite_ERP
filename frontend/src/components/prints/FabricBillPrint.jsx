import React, { forwardRef } from "react";
import dayjs from "dayjs";

const FabricBillPrint = forwardRef(
  (
    { data, concernData, partyData, invoiceToData, einvoiceData, gstMasters, printType = "Invoice", quotationRates = [], quotationHeader = null, processes = [], masters = [] },
    ref,
  ) => {
    // Return null if no data is provided
    if (!data) {
      return null;
    }

    const hasEinvoice = einvoiceData && einvoiceData.status === 1;

    // Convert amount to words
    const numberToWords = (num) => {
      const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
      ];
      const teens = [
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];
      const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ];
      const thousands = ["", "Thousand", "Lakh", "Crore"];

      if (num === 0) return "Zero";

      const convertHundreds = (n) => {
        let result = "";
        if (n >= 100) {
          result += ones[Math.floor(n / 100)] + " Hundred ";
          n %= 100;
        }
        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + " ";
          n %= 10;
        } else if (n >= 10) {
          result += teens[n - 10] + " ";
          return result;
        }
        if (n > 0) {
          result += ones[n] + " ";
        }
        return result;
      };

      const convertToWords = (n) => {
        if (n === 0) return "";

        let result = "";
        let thousandCounter = 0;

        while (n > 0) {
          if (n % 1000 !== 0) {
            result =
              convertHundreds(n % 1000) +
              thousands[thousandCounter] +
              " " +
              result;
          }
          n = Math.floor(n / 1000);
          thousandCounter++;
        }

        return result.trim();
      };

      const integerPart = Math.floor(num);
      const decimalPart = Math.round((num - integerPart) * 100);

      let words = convertToWords(integerPart);
      if (decimalPart > 0) {
        words += " and " + convertToWords(decimalPart) + " Paise";
      }

      return words + " Only";
    };

    const getMasterName = (id, type) => {
      return masters?.find(m => m.id === id && m.masterType === type)?.masterName || '';
    };

    const dcGroups = {};
    const generalGroup = { 'General': [] };
    const items = data?.details || [];
    
    items.forEach(item => {
      const dc = item.dcNo || 'General';
      if (!dcGroups[dc]) dcGroups[dc] = [];
      dcGroups[dc].push(item);
      
      generalGroup['General'].push(item);
    });

    if (Object.keys(dcGroups).length === 0) {
      dcGroups['General'] = [];
    }

    const itemsPerPageDC = 5;
    const pagesDC = [];
    Object.entries(dcGroups).forEach(([dcNo, inwItems]) => {
      for (let i = 0; i < inwItems.length; i += itemsPerPageDC) {
        const pageItems = inwItems.slice(i, i + itemsPerPageDC);
        const emptyRows = Array(itemsPerPageDC - pageItems.length).fill(null);
        pagesDC.push({ dcNo: dcNo, items: pageItems, emptyRows });
      }
    });

    const totalRowsQuot = 5;
    const pagesQuot = [];
    const allQuotations = quotationRates || [];
    
    allQuotations.forEach(quot => {
      const quotDetails = quot.details || [];
      if (quotDetails.length === 0) {
        pagesQuot.push({ quotation: quot, items: [], emptyRowsQuot: Array(totalRowsQuot).fill(null) });
      } else {
        const emptyRowsCount = totalRowsQuot - quotDetails.length;
        const emptyRowsQuot = Array(emptyRowsCount > 0 ? emptyRowsCount : 0).fill(null);
        pagesQuot.push({ quotation: quot, items: quotDetails, emptyRowsQuot });
      }
    });

    if (allQuotations.length === 0) {
      pagesQuot.push({ quotation: null, items: [], emptyRowsQuot: Array(totalRowsQuot).fill(null) });
    }

    if (pagesQuot.length === 0) {
      pagesQuot.push({ items: [], emptyRowsQuot: Array(totalRowsQuot).fill(null) });
    }

    const pagesInvoice = [];
    Object.entries(generalGroup).forEach(([inwNo, inwItems]) => {
      const emptyRowsCount = 12 - inwItems.length;
      const emptyRowsInvoice = Array(Math.max(0, emptyRowsCount)).fill(null);
      pagesInvoice.push({ inwardNo: inwNo, items: inwItems, emptyRowsInvoice });
    });

    return (
      <div ref={ref}>
        {printType === "DC" && (
          <div style={{ fontFamily: 'Arial, sans-serif' }} data-print-content>
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
              .order-section { display: flex; padding: 4px 6px; font-size: 9px; }
              .order-left { flex: 1; }
              .order-center { flex: 1; text-align: center; }
              .order-right { flex: 1; text-align: right; }
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
              .process-section { display: flex; border-top: 2px solid #000; padding: 4px 6px; font-size: 9px; }
              .process-left { flex: 1; }
              .process-right { flex: 1; text-align: right; }
              .footer-section { display: flex; border-top: 2px solid #000; min-height: 50px; }
              .footer-col { flex: 1; text-align: center; font-size: 9px; padding: 6px; display: flex; align-items: flex-end; justify-content: center; }
            `}</style>
            
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
                      <div className="delivery-note-title">DELIVERY NOTE</div>
                      <div className="dc-details">
                        <div className="doc-info-row"><strong>DC No</strong> : {page.dcNo !== 'General' ? page.dcNo : (data?.billNo || '')}</div>
                        <div className="doc-info-row"><strong>DC Date</strong> : {page.items[0]?.dcDate ? dayjs(page.items[0].dcDate).format('DD-MMM-YYYY') : (data?.billDate ? dayjs(data.billDate).format('DD-MMM-YYYY') : '')}</div>
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
                      <div className="party-details">
                        <div className="doc-info-row"><strong>Received From</strong> : {data?.dyeParty || '-'}</div>
                        <div className="doc-info-row"><strong>DC No</strong> : {data?.dyeDcNo || ''}</div>
                        <div className="doc-info-row"><strong>Party DC No</strong> : {page.items[0]?.pdcNo || ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="order-section">
                    <div className="order-left">
                      <strong>Order No</strong> : {page.items[0]?.orderNo || data?.orderNo || ''}
                    </div>
                    <div className="order-center">
                      <strong>Job No</strong> : {page.items[0]?.jobNo || data?.jobNo || ''}
                    </div>
                    <div className="order-right">
                      <strong>Rec Weight</strong> : {page.items[0]?.recWeight || data?.recWeight || ''}
                    </div>
                  </div>

                  <table className="details-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>Fabric</th>
                        <th style={{ width: '15%' }}>Color</th>
                        <th style={{ width: '10%' }}>Dia</th>
                        <th style={{ width: '10%' }}>Rolls</th>
                        <th style={{ width: '12%' }}>Dc Wt</th>
                        <th style={{ width: '23%' }}>Previous Dc List</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.items.map((item, index) => {
                        return (
                        <tr key={index}>
                          <td className="text-left">
                            {item.fabric || item.fabricName || getMasterName(item.fabricId, 'Fabric') || '-'} {item.designName ? `/ ${item.designName}` : ''}
                            {data?.enableItemWiseProcess && item.processes && (
                              <><br /><span style={{ fontSize: '7px', fontStyle: 'italic' }}>{typeof item.processes === 'string' ? JSON.parse(item.processes).join(' / ') : item.processes.join(' / ')}</span></>
                            )}
                          </td>
                          <td className="text-left">{item.color || item.colorName || getMasterName(item.colorId, 'Color') || '-'}</td>
                          <td>{item.dia || item.diaName || getMasterName(item.diaId, 'Dia') || '-'}</td>
                          <td>{item.rolls || ''}</td>
                          <td>{item.weight || ''}</td>
                          {index === 0 && (
                            <td rowSpan={itemsPerPageDC} style={{ verticalAlign: 'top', padding: 0 }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                                <tbody>
                                  {(page.items[0]?.previousList || data?.previousList)?.map((prev, i) => (
                                    <tr key={i}>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{prev.dcNo}</td>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{dayjs(prev.dcDate).format('DD/MM/YY')}</td>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{prev.totalRolls}</td>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{Number(prev.totalQty).toFixed(3)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          )}
                        </tr>
                        );
                      })}
                      {page.emptyRows.map((_, index) => (
                        <tr key={`empty-${index}`}>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          {page.items.length === 0 && index === 0 && (
                            <td rowSpan={itemsPerPageDC} style={{ verticalAlign: 'top', padding: 0 }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                                <tbody>
                                  {(page.items[0]?.previousList || data?.previousList)?.map((prev, i) => (
                                    <tr key={i}>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{prev.dcNo}</td>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{dayjs(prev.dcDate).format('DD/MM/YY')}</td>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{prev.totalRolls}</td>
                                      <td style={{ border: 'none', padding: '2px', textAlign: 'center' }}>{Number(prev.totalQty).toFixed(3)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <table className="details-table" style={{ borderTop: 'none' }}>
                    <tbody>
                      <tr className="total-row">
                        <td colSpan={2} style={{ width: '45%', border: 'none', borderLeft: '1px solid #000', textAlign: 'left', paddingLeft: '4px', fontWeight: 'normal', fontSize: '9px' }}>Remarks : {page.items[0]?.remarks || data?.remarks || ''}</td>
                        <td style={{ width: '10%', textAlign: 'center', borderLeft: '1px solid #000', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>Total</td>
                        <td style={{ width: '10%', textAlign: 'center', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>{page.items.reduce((sum, item) => sum + (parseFloat(item.rolls) || 0), 0)}</td>
                        <td style={{ width: '12%', textAlign: 'center', borderTop: '1px solid #000', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>{page.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0)}</td>
                        <td style={{ width: '23%', border: 'none', borderRight: '1px solid #000' }}>&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>

                  {!(page.items[0]?.enableItemWiseProcess || data?.enableItemWiseProcess) && (
                    <div className="process-section">
                      <div className="process-left">
                        <strong>Process</strong> &nbsp;&nbsp; {page.items[0]?.process || data?.process || ''}
                      </div>
                    </div>
                  )}

                  <div className="footer-section">
                    <div className="footer-col">
                      <div>
                        {data?.receivedName && <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{data.receivedName}</div>}
                        <strong>Received By</strong>
                      </div>
                    </div>
                    <div className="footer-col">
                      <div><div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{data?.vehicleNo || ''}</div><strong>Vehicle No</strong></div>
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
            <style>{`
              @media print {
                @page { margin: 10mm; size: A4; }
                body { margin: 0; }
                body::before, body::after { display: none !important; }
                @page { margin: 0; }
              }
              @page { size: auto; margin: 0mm; }
              .page-container { page-break-after: always; margin-bottom: 20px; }
              .page-container:last-child { page-break-after: auto; }
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
            
            {pagesQuot.map((page, pageIndex) => {
              const currentQuot = page.quotation || {};
              return (
              <div key={pageIndex} className="page-container">
                <div className="print-title">RATE QUOTATION</div>
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
                        <strong>Quot No :</strong> {currentQuot.quotNo || data?.billNo || ''}<br /><br />
                        <strong>Quot Date :</strong> {(currentQuot.quotDate || data?.billDate) ? dayjs(currentQuot.quotDate || data?.billDate).format('DD/MM/YYYY') : ''}
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
                      {page.items.map((detail, index) => {
                        const processName = processes.find(p => p.id === detail.processId)?.processName || '-';
                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td className="text-left">{processName}</td>
                            <td>{Number(detail.rate || 0).toFixed(2)}</td>
                            <td>{Number(detail.confirmRate || 0).toFixed(2)}</td>
                            <td className="text-left">{detail.remarks || ''}</td>
                          </tr>
                        );
                      })}
                      {page.emptyRowsQuot.map((_, index) => (
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
                    {currentQuot.paymentTerms || data?.paymentTerms || ''}
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
              );
            })}
          </div>
        )}

        {(printType !== "DC" && printType !== "Quotation") && (
          <div style={{ fontFamily: "Arial, sans-serif" }} data-print-content>
        <style>{`
        @media print {
          @page { 
            margin: 10mm 10mm; 
            size: A4; 
          }
          body { 
            margin: 0; 
          }
          nav, .ant-layout-header, .page-header {
            display: none !important;
          }
        }
        @page { size: A4; margin: 10mm 10mm; }
        .page-container { page-break-after: always; margin-bottom: 20px; }
        .page-container:last-child { page-break-after: auto; }
      `}</style>

        {pagesInvoice.map((page, pageIndex) => (
        <div key={pageIndex} className="page-container" style={{ padding: "20px", fontSize: "14px", lineHeight: "1.2", minHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          {/* Title Section - Always Visible */}
          <div
            style={{
              position: "relative",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            GST INVOICE
            <span style={{ position: "absolute", right: 0, bottom: 0, fontSize: "14px", fontWeight: "bold" }}>
              (ORIGINAL)
            </span>
          </div>

          <div style={{ textAlign: "center", fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}>
            Inward No: {page.inwardNo}
          </div>

          {/* E-invoice Section - Only show if E-invoice is generated */}
          {hasEinvoice && (

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid black",
                marginBottom: "10px",
              }}
            >
              <tr>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    width: "70%",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
                    e-Invoice Details :
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tr>
                      <td style={{ fontWeight: "bold", width: "15%" }}>IRN No</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td style={{ paddingLeft: "5px", wordBreak: "break-all" }}>
                        {einvoiceData.irnNo}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Ack. No</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td style={{ paddingLeft: "5px" }}>
                        {einvoiceData.ackNo}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Ack Date</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td style={{ paddingLeft: "5px" }}>
                        {einvoiceData.ackDate
                          ? dayjs(einvoiceData.ackDate).format(
                            "DD/MM/YYYY HH:mm:ss",
                          )
                          : ""}
                      </td>
                    </tr>
                  </table>
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    width: "30%",
                    textAlign: "center",
                    verticalAlign: "center",
                  }}
                >
                  {einvoiceData.qrText && (
                    <div
                      style={{
                        fontSize: "8px",
                        wordBreak: "break-all",
                        fontFamily: "monospace",
                        backgroundColor: "#000",
                        color: "#fff",
                        padding: "5px",
                        minHeight: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      QR CODE
                    </div>
                  )}
                </td>
              </tr>
            </table>
          )}

          {/* Header Section with Logo and Bill Details */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid black",
            }}
          >
            <tr>
              <td
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  width: "70%",
                  verticalAlign: "top",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  {/* Logo */}
                  {concernData?.logo && (
                    <div style={{ marginRight: "15px", flexShrink: 0 }}>
                      <img
                        src={concernData.logo}
                        alt="Company Logo"
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "contain",
                          border: "1px solid #ccc",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                  )}

                  {/* Concern Details */}
                  <div style={{ fontSize: "12px", lineHeight: "1.3", flex: 1 }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        marginBottom: "3px",
                        textTransform: "uppercase",
                      }}
                    >
                      {concernData?.partyName || "COMPANY NAME"}
                    </div>
                    <div style={{ fontSize: "11px", marginBottom: "2px" }}>
                      {[concernData?.address1, concernData?.address2]
                        .filter(Boolean)
                        .join(", ")}
                      {concernData?.address3 && (
                        <>
                          <br />
                          {concernData.address3}
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", marginBottom: "2px" }}>
                      Phone No :{concernData?.phoneNo || ""},{concernData?.mobileNo || ""}
                    </div>
                    <div style={{ fontSize: "11px", marginBottom: "2px" }}>
                      <strong>GST No.: {concernData?.gstNo || ""}</strong>
                    </div>
                    <div style={{ fontSize: "11px" }}>
                      <strong>MSME No :{concernData?.msmeNo || ""}</strong>
                    </div>
                  </div>
                </div>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  width: "30%",
                  verticalAlign: "top",
                }}
              >
                <table
                  style={{
                    fontSize: "12px",
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <tr>
                    <td style={{ fontWeight: "bold", width: "40%", paddingBottom: "10px", whiteSpace: "nowrap" }}>Bill No</td>
                    <td style={{ width: "5px", paddingBottom: "10px" }}> :</td>
                    <td style={{ paddingBottom: "10px" }}>{data?.billNo || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", paddingBottom: "10px", whiteSpace: "nowrap" }}>Bill Date</td>
                    <td style={{ width: "5px", paddingBottom: "10px" }}> :</td>
                    <td style={{ paddingBottom: "10px" }}>
                      {data?.billDate
                        ? dayjs(data.billDate).format("DD/MM/YYYY")
                        : ""}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>HSN Code</td>
                    <td style={{ width: "5px" }}> :</td>
                    <td>
                      {data?.hsnCode || ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          {/* Party Details Section */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid black",
              borderTop: "none",
              marginTop: "0",
            }}
          >
            <tr>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "8px",
                  width: "50%",
                  verticalAlign: "top",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "3px",
                  }}
                >
                  To
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  <strong>{partyData?.partyName}</strong>
                  <br />
                  {partyData?.address1 && partyData?.address2 && (
                    <>
                      {partyData.address1}, {partyData.address2}
                      <br />
                    </>
                  )}
                  {!partyData?.address2 && partyData?.address1 && (
                    <>
                      {partyData.address1}
                      <br />
                    </>
                  )}
                  {partyData?.address2 && !partyData?.address1 && (
                    <>
                      {partyData.address2}
                      <br />
                    </>
                  )}
                  {[
                    partyData?.address3,
                    partyData?.address4,
                    partyData?.district,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  {[
                    partyData?.address3,
                    partyData?.address4,
                    partyData?.district,
                  ].filter(Boolean).length > 0 && <br />}
                  {partyData?.phoneNo && <>Phone No: {partyData.phoneNo}</>}
                  {partyData?.phoneNo &&
                    (partyData?.mobileNo || partyData?.email) && <>, </>}
                  {partyData?.mobileNo && <>Mobile No: {partyData.mobileNo}</>}
                  {partyData?.mobileNo && partyData?.email && <>, </>}
                  {partyData?.email && <>Mail Id: {partyData.email}</>}
                  {(partyData?.phoneNo ||
                    partyData?.mobileNo ||
                    partyData?.email) && <br />}
                  {partyData?.gstNo && (
                    <>
                      <strong>GST No.: {partyData.gstNo}</strong>
                    </>
                  )}
                </div>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "8px",
                  width: "50%",
                  verticalAlign: "top",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "3px",
                  }}
                >
                  Invoice To
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  <strong>{invoiceToData?.partyName}</strong>
                  <br />
                  {invoiceToData?.address1 && invoiceToData?.address2 && (
                    <>
                      {invoiceToData.address1}, {invoiceToData.address2}
                      <br />
                    </>
                  )}
                  {!invoiceToData?.address2 && invoiceToData?.address1 && (
                    <>
                      {invoiceToData.address1}
                      <br />
                    </>
                  )}
                  {invoiceToData?.address2 && !invoiceToData?.address1 && (
                    <>
                      {invoiceToData.address2}
                      <br />
                    </>
                  )}
                  {[
                    invoiceToData?.address3,
                    invoiceToData?.address4,
                    invoiceToData?.district,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  {[
                    invoiceToData?.address3,
                    invoiceToData?.address4,
                    invoiceToData?.district,
                  ].filter(Boolean).length > 0 && <br />}
                  {invoiceToData?.phoneNo && (
                    <>Phone No: {invoiceToData.phoneNo}</>
                  )}
                  {invoiceToData?.phoneNo &&
                    (invoiceToData?.mobileNo || invoiceToData?.email) && (
                      <>, </>
                    )}
                  {invoiceToData?.mobileNo && (
                    <>Mobile No: {invoiceToData.mobileNo}</>
                  )}
                  {invoiceToData?.mobileNo && invoiceToData?.email && <>, </>}
                  {invoiceToData?.email && <>Mail Id: {invoiceToData.email}</>}
                  {(invoiceToData?.phoneNo ||
                    invoiceToData?.mobileNo ||
                    invoiceToData?.email) && <br />}
                  {invoiceToData?.gstNo && (
                    <>
                      <strong>GST No.: {invoiceToData.gstNo}</strong>
                    </>
                  )}
                </div>
              </td>
            </tr>
          </table>

          {/* Bill Items Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid black",
              marginTop: "0",
              flexGrow: 1, // Let the table expand to fill remaining page height
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Dc Date
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Dc No
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  PDC No
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Process
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Roll
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Rate
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((detail, index) => (
                <tr key={index}>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    {detail.dcDate
                      ? dayjs(detail.dcDate).format("DD/MM/YYYY")
                      : ""}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    {detail.dcNo || ""}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    {detail.pdcNo || ""}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                    }}
                  >
                    {detail.process || detail.processList || "Fabric Delivery"}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                      textAlign: "center",
                    }}
                  >
                    {detail.rolls || 0}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                      textAlign: "right",
                    }}
                  >
                    {Number(detail.weight || 0).toFixed(3)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                      textAlign: "right",
                    }}
                  >
                    {Number(detail.rate || 0).toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "11px",
                      textAlign: "right",
                    }}
                  >
                    {Number(detail.amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Pad with empty rows to maintain minimum height */}
              {page.emptyRowsInvoice.map((_, emptyIndex) => (
                <tr key={`empty-${emptyIndex}`}>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "11px" }}>&nbsp;</td>
                </tr>
              ))}

              {/* Filler row to push footer to bottom */}
              <tr className="hide-on-print-unless-short" style={{ height: "100%" }}>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
                <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none" }}></td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: "bold" }}>
                <td
                  colSpan="4"
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Total
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {page.items.reduce(
                    (sum, d) => sum + (Number(d.rolls) || 0),
                    0,
                  ) || 0}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {page.items.reduce(
                    (sum, d) => sum + (Number(d.weight) || 0),
                    0,
                  ).toFixed(3)}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                  }}
                ></td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "12px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {page.items.reduce(
                    (sum, d) => sum + (Number(d.amount) || 0),
                    0,
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan="3"
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "5px",
                    }}
                  >
                    Bank Details :
                  </div>
                  <table
                    style={{
                      fontSize: "11px",
                      lineHeight: "1.3",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <tr>
                      <td style={{ fontWeight: "bold", width: "25%" }}>Name</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td>{concernData?.partyName || ""}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Bank</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td>{concernData?.bank || ""}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>A/C No</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td>{concernData?.accountNo || ""}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Branch</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td>{concernData?.branch || ""}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>IFSC</td>
                      <td style={{ width: "5px" }}> :</td>
                      <td>{concernData?.ifscCode || ""}</td>
                    </tr>
                  </table>
                </td>
                <td
                  colSpan="5"
                  style={{
                    border: "1px solid black",
                    padding: "8px 0",
                    verticalAlign: "top",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      fontSize: "11px",
                      borderCollapse: "collapse",
                    }}
                  >
                    {(Number(data?.noOfScreen || 0) > 0 || Number(data?.screenAmount || 0) > 0) && (
                      <tr>
                        <td style={{ width: "100%", paddingBottom: "5px", paddingLeft: "5px" }}>
                          {Number(data?.noOfScreen || 0) > 0 ? `Nos: ${data.noOfScreen}` : ""}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap", paddingBottom: "5px", paddingRight: "5px" }}>Screen Amount</td>
                        <td style={{ width: "10px", textAlign: "center", paddingBottom: "5px" }}>:</td>
                        <td style={{ width: "130px", textAlign: "right", paddingBottom: "5px", paddingRight: "5px" }}>
                          {Number(data?.screenAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    )}

                    {data?.taxes?.map((tax, index) => {
                      const taxName =
                        gstMasters?.find((g) => g.id === tax.taxName)?.taxName ||
                        tax.taxName;
                      return (
                        <tr key={index}>
                          <td style={{ width: "100%", paddingBottom: "5px", paddingLeft: "5px" }}></td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap", paddingBottom: "5px", paddingRight: "5px" }}>{taxName}</td>
                          <td style={{ width: "10px", textAlign: "center", paddingBottom: "5px" }}>:</td>
                          <td style={{ width: "130px", textAlign: "right", paddingBottom: "5px", paddingRight: "5px" }}>
                            {Number(tax.taxAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={{ width: "100%", paddingBottom: "5px", paddingLeft: "5px" }}></td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", paddingBottom: "5px", paddingRight: "5px" }}>Round Off</td>
                      <td style={{ width: "10px", textAlign: "center", paddingBottom: "5px" }}>:</td>
                      <td style={{ width: "130px", textAlign: "right", paddingBottom: "5px", paddingRight: "5px" }}>
                        {Number(data?.roundOff || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderTop: "1px solid black", width: "100%", paddingLeft: "5px" }}></td>
                      <td style={{ borderTop: "1px solid black", textAlign: "right", whiteSpace: "nowrap", paddingTop: "5px", paddingRight: "5px", fontWeight: "bold", fontSize: "13px" }}>
                        Net Amount
                      </td>
                      <td style={{ borderTop: "1px solid black", width: "10px", textAlign: "center", paddingTop: "5px", fontWeight: "bold" }}>:</td>
                      <td style={{ borderTop: "1px solid black", width: "130px", textAlign: "right", paddingTop: "5px", paddingRight: "5px", fontWeight: "bold", fontSize: "13px" }}>
                        {Number(data?.netAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in Words */}
          <div
            style={{
              border: "1px solid black",
              borderTop: "0",
              padding: "8px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {numberToWords(Number(data?.netAmount || 0))}
          </div>

          {/* Footer Section */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid black",
              borderTop: "none",
              marginTop: "0",
            }}
          >
            <tr>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "15px",
                  width: "20%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "12px",
                }}
              >
                <strong>Received By</strong>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "15px",
                  width: "20%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "12px",
                }}
              >
                <strong>Prepared By</strong>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "15px",
                  width: "20%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "12px",
                }}
              >
                <strong>Check By</strong>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "15px",
                  width: "40%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "12px",
                }}
              >
                <div style={{ textAlign: "right", marginBottom: "25px", whiteSpace: "nowrap" }}>
                  <strong>For {concernData?.partyName || ""}</strong>
                </div>
                <strong>Authorised Signature</strong>
              </td>
            </tr>
          </table>
        </div>
        ))}
      </div>
    )}
  </div>
);
});

FabricBillPrint.displayName = "FabricBillPrint";

export default FabricBillPrint;
