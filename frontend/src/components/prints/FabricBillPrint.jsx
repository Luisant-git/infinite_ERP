import React, { forwardRef } from "react";
import dayjs from "dayjs";

const FabricBillPrint = forwardRef(
  (
    { data, concernData, partyData, invoiceToData, einvoiceData, gstMasters },
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

    return (
      <div ref={ref} style={{ fontFamily: "Arial, sans-serif" }}>
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
      `}</style>

        <div style={{ padding: "20px", fontSize: "12px", lineHeight: "1.2", minHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
          {/* Title Section - Always Visible */}
          <div
            style={{
              position: "relative",
              textAlign: "center",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            GST INVOICE
            <span style={{ position: "absolute", right: 0, bottom: 0, fontSize: "12px", fontWeight: "bold" }}>
              (ORIGINAL)
            </span>
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
                    fontSize: "10px",
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
                        fontSize: "6px",
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
                  <div style={{ fontSize: "10px", lineHeight: "1.3", flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        marginBottom: "3px",
                        textTransform: "uppercase",
                      }}
                    >
                      {concernData?.partyName || "COMPANY NAME"}
                    </div>
                    <div style={{ fontSize: "9px", marginBottom: "2px" }}>
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
                    <div style={{ fontSize: "9px", marginBottom: "2px" }}>
                      Phone No :{concernData?.phoneNo || ""},{concernData?.mobileNo || ""}
                    </div>
                    <div style={{ fontSize: "9px", marginBottom: "2px" }}>
                      <strong>GST No.: {concernData?.gstNo || ""}</strong>
                    </div>
                    <div style={{ fontSize: "9px" }}>
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
                    fontSize: "10px",
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
                    fontSize: "10px",
                    fontWeight: "bold",
                    marginBottom: "3px",
                  }}
                >
                  To
                </div>
                <div style={{ fontSize: "10px", lineHeight: "1.4" }}>
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
                    fontSize: "10px",
                    fontWeight: "bold",
                    marginBottom: "3px",
                  }}
                >
                  Invoice To
                </div>
                <div style={{ fontSize: "10px", lineHeight: "1.4" }}>
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
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Dc Date
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Dc No
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  PDC No
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Process
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Roll
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Rate
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.details?.map((detail, index) => (
                <tr key={index}>
                  <td
                    style={{
                      border: "1px solid black",
                      borderTop: "none",
                      borderBottom: "none",
                      padding: "4px",
                      fontSize: "9px",
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
                      fontSize: "9px",
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
                      fontSize: "9px",
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
                      fontSize: "9px",
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
                      fontSize: "9px",
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
                      fontSize: "9px",
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
                      fontSize: "9px",
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
                      fontSize: "9px",
                      textAlign: "right",
                    }}
                  >
                    {Number(detail.amount || 0).toFixed(2)}
                  </td>
                </tr>
              )) || []}

              {/* Pad with empty rows to maintain minimum height */}
              {Array.from({
                length: Math.max(0, 12 - (data?.details?.length || 0)),
              }).map((_, emptyIndex) => (
                <tr key={`empty-${emptyIndex}`}>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
                  <td style={{ border: "1px solid black", borderTop: "none", borderBottom: "none", padding: "4px", fontSize: "9px" }}>&nbsp;</td>
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
                    fontSize: "10px",
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
                    fontSize: "10px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {data?.details?.reduce(
                    (sum, d) => sum + (Number(d.rolls) || 0),
                    0,
                  ) || 0}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {Number(data?.totalQty || 0).toFixed(3)}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                  }}
                ></td>
                <td
                  style={{
                    border: "1px solid black",
                    padding: "5px",
                    fontSize: "10px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {Number(data?.totalAmount || 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan="4"
                  style={{
                    border: "1px solid black",
                    padding: "8px",
                    verticalAlign: "top",
                  }}
                >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    marginBottom: "5px",
                  }}
                >
                  Bank Details :
                </div>
                <table
                  style={{
                    fontSize: "9px",
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
                colSpan="4"
                style={{
                  border: "1px solid black",
                  padding: "8px 0",
                  verticalAlign: "top",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    fontSize: "9px",
                    borderCollapse: "collapse",
                  }}
                >
                  {(Number(data?.noOfScreen || 0) > 0 || Number(data?.screenAmount || 0) > 0) && (
                    <tr>
                      <td style={{ width: "100%", paddingBottom: "5px", paddingLeft: "5px" }}>
                        {Number(data?.noOfScreen || 0) > 0 ? `Nos: ${data.noOfScreen}` : ""}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", paddingBottom: "5px", paddingRight: "10px" }}>Screen Amount</td>
                      <td style={{ width: "10px", textAlign: "center", paddingBottom: "5px" }}>:</td>
                      <td style={{ width: "80px", textAlign: "left", paddingBottom: "5px", paddingRight: "5px", paddingLeft: "5px" }}>
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
                        <td style={{ textAlign: "right", whiteSpace: "nowrap", paddingBottom: "5px", paddingRight: "10px" }}>{taxName}</td>
                        <td style={{ width: "10px", textAlign: "center", paddingBottom: "5px" }}>:</td>
                        <td style={{ width: "80px", textAlign: "left", paddingBottom: "5px", paddingRight: "5px", paddingLeft: "5px" }}>
                          {Number(tax.taxAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                     <td style={{ width: "100%", paddingBottom: "5px", paddingLeft: "5px" }}></td>
                     <td style={{ textAlign: "right", whiteSpace: "nowrap", paddingBottom: "5px", paddingRight: "10px" }}>Round Off</td>
                     <td style={{ width: "10px", textAlign: "center", paddingBottom: "5px" }}>:</td>
                     <td style={{ width: "80px", textAlign: "left", paddingBottom: "5px", paddingRight: "5px", paddingLeft: "5px" }}>
                      {Number(data?.roundOff || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ borderTop: "1px solid black", width: "100%", paddingLeft: "5px" }}></td>
                    <td style={{ borderTop: "1px solid black", textAlign: "right", whiteSpace: "nowrap", paddingTop: "5px", paddingRight: "10px", fontWeight: "bold", fontSize: "11px" }}>
                      Net Amount
                    </td>
                    <td style={{ borderTop: "1px solid black", width: "10px", textAlign: "center", paddingTop: "5px", fontWeight: "bold" }}>:</td>
                    <td style={{ borderTop: "1px solid black", width: "80px", textAlign: "left", paddingTop: "5px", paddingRight: "5px", paddingLeft: "5px", fontWeight: "bold", fontSize: "11px" }}>
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
              fontSize: "10px",
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
                  width: "25%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "10px",
                }}
              >
                <strong>Received By</strong>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "15px",
                  width: "25%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "10px",
                }}
              >
                <strong>Prepared By</strong>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "15px",
                  width: "25%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "10px",
                }}
              >
                <strong>Check By</strong>
              </td>
              <td
                style={{
                  border: "1px solid black",
                  borderTop: "none",
                  padding: "15px",
                  width: "25%",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  fontSize: "10px",
                }}
              >
                <div style={{ textAlign: "right", marginBottom: "25px" }}>
                  <strong>For {concernData?.partyName || ""}</strong>
                </div>
                <strong>Authorised Signature</strong>
              </td>
            </tr>
          </table>
        </div>
      </div>
    );
  },
);

FabricBillPrint.displayName = "FabricBillPrint";

export default FabricBillPrint;
