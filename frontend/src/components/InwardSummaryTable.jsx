import React, { useState } from "react";
import { Table, Input, Checkbox, Button, Space } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const InwardSummaryTable = ({
  data,
  loading = false,
  showPagination = true,
  tableId = "default",
  totals: totalsProp,
}) => {
  const [filteredInfo, setFilteredInfo] = useState({});
  const [searchText, setSearchText] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const handleColumnHide = (columnKey) => {
    setHiddenColumns((prev) => [...prev, columnKey]);
  };

  const handleColumnShow = (columnKey) => {
    setHiddenColumns((prev) => prev.filter((key) => key !== columnKey));
  };

  const handleTableChange = (pagination, filters) => {
    setFilteredInfo(filters);
  };

  const getColumnSearchProps = (dataIndex, title) => {
    const uniqueValues = [
      ...new Set(
        data
          .map((item) => {
            const value = item[dataIndex];
            if (dataIndex === "inwardDate" && value) {
              return dayjs(value).format("DD-MM-YYYY");
            }
            return value;
          })
          .filter(Boolean),
      ),
    ];

    const currentSearch = searchText[dataIndex] || "";

    const filteredValues = uniqueValues.filter((value) =>
      value.toString().toLowerCase().includes(currentSearch.toLowerCase()),
    );

    return {
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8, width: 250 }}>
          <Input
            placeholder={`Search ${title}`}
            value={currentSearch}
            onChange={(e) => {
              setSearchText((prev) => ({
                ...prev,
                [dataIndex]: e.target.value,
              }));
            }}
            onPressEnter={() => {
              // Filter by search text directly
              if (currentSearch.trim()) {
                const matchingValues = uniqueValues.filter((value) =>
                  value
                    .toString()
                    .toLowerCase()
                    .includes(currentSearch.toLowerCase()),
                );
                setSelectedKeys(matchingValues);
              }
              confirm();
            }}
            style={{ marginBottom: 8, display: "block" }}
            size="small"
          />
          <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 8 }}>
            <Checkbox
              indeterminate={
                selectedKeys.length > 0 &&
                selectedKeys.length < uniqueValues.length
              }
              checked={
                selectedKeys.length === uniqueValues.length &&
                uniqueValues.length > 0
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedKeys(uniqueValues);
                } else {
                  setSelectedKeys([]);
                }
              }}
              style={{ marginBottom: 4, fontWeight: 600 }}
            >
              Select All ({uniqueValues.length})
            </Checkbox>
            {filteredValues.map((value) => (
              <div key={value} style={{ marginBottom: 4 }}>
                <Checkbox
                  checked={selectedKeys.includes(value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedKeys([...selectedKeys, value]);
                    } else {
                      setSelectedKeys(
                        selectedKeys.filter((key) => key !== value),
                      );
                    }
                  }}
                >
                  {value}
                </Checkbox>
              </div>
            ))}
          </div>
          <Space>
            <Button
              type="primary"
              onClick={() => {
                // Filter by search text if entered
                if (currentSearch.trim()) {
                  const matchingValues = uniqueValues.filter((value) =>
                    value
                      .toString()
                      .toLowerCase()
                      .includes(currentSearch.toLowerCase()),
                  );
                  setSelectedKeys(matchingValues);
                }
                confirm();
              }}
              size="small"
              style={{ width: 70 }}
            >
              Filter
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                setSearchText((prev) => ({ ...prev, [dataIndex]: "" }));
                confirm();
              }}
              size="small"
              style={{ width: 70 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <FilterOutlined
          style={{ color: filtered ? "#ffff00" : "#bfbfbf", fontSize: "12px" }}
        />
      ),
      onFilter: (value, record) => {
        const recordValue =
          dataIndex === "inwardDate" && record[dataIndex]
            ? dayjs(record[dataIndex]).format("DD-MM-YYYY")
            : record[dataIndex];
        return recordValue === value;
      },
      filteredValue: filteredInfo[dataIndex] || null,
    };
  };

  const columns = [
    {
      title: "S.No",
      key: "sno",
      width: 50,
      render: (_, record, index) => index + 1,
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Inward No
          <span
            onClick={() => handleColumnHide("inwardNo")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "inwardNo",
      key: "inwardNo",
      width: 100,
      ...getColumnSearchProps("inwardNo", "Inward No"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Inward Date
          <span
            onClick={() => handleColumnHide("inwardDate")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "inwardDate",
      key: "inwardDate",
      width: 110,
      render: (date) => dayjs(date).format("DD-MM-YYYY"),
      ...getColumnSearchProps("inwardDate", "Inward Date"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Party Name
          <span
            onClick={() => handleColumnHide("partyName")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "partyName",
      key: "partyName",
      width: 150,
      ...getColumnSearchProps("partyName", "Party Name"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          PDC No
          <span
            onClick={() => handleColumnHide("pdcNo")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "pdcNo",
      key: "pdcNo",
      width: 100,
      ...getColumnSearchProps("pdcNo", "PDC No"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Order No
          <span
            onClick={() => handleColumnHide("orderNo")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "orderNo",
      key: "orderNo",
      width: 100,
      ...getColumnSearchProps("orderNo", "Order No"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Fabric
          <span
            onClick={() => handleColumnHide("fabric")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "fabric",
      key: "fabric",
      width: 120,
      ...getColumnSearchProps("fabric", "Fabric"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Dia
          <span
            onClick={() => handleColumnHide("dia")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "dia",
      key: "dia",
      width: 80,
      ...getColumnSearchProps("dia", "Dia"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Color
          <span
            onClick={() => handleColumnHide("color")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "color",
      key: "color",
      width: 100,
      ...getColumnSearchProps("color", "Color"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Inward Kgs
          <span
            onClick={() => handleColumnHide("inwardKgs")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "inwardKgs",
      key: "inwardKgs",
      width: 100,
      align: "right",
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps("inwardKgs", "Inward Kgs"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Process Kgs
          <span
            onClick={() => handleColumnHide("processKgs")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "processKgs",
      key: "processKgs",
      width: 100,
      align: "right",
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps("processKgs", "Process Kgs"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          DC Kgs
          <span
            onClick={() => handleColumnHide("dcKgs")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "dcKgs",
      key: "dcKgs",
      width: 100,
      align: "right",
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps("dcKgs", "DC Kgs"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Return Kgs
          <span
            onClick={() => handleColumnHide("returnKgs")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "returnKgs",
      key: "returnKgs",
      width: 100,
      align: "right",
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps("returnKgs", "Return Kgs"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Balance Kgs
          <span
            onClick={() => handleColumnHide("balanceKgs")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "balanceKgs",
      key: "balanceKgs",
      width: 100,
      align: "right",
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps("balanceKgs", "Balance Kgs"),
    },
    {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          UOM
          <span
            onClick={() => handleColumnHide("uom")}
            style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
            title="Hide column"
          >
            ×
          </span>
        </div>
      ),
      dataIndex: "uom",
      key: "uom",
      width: 120,
      ...getColumnSearchProps("uom", "UOM"),
    },
  ].filter((col) => !hiddenColumns.includes(col.key));

  const getFilteredData = () => {
    if (!filteredInfo || Object.keys(filteredInfo).length === 0) {
      return data;
    }

    return data.filter((item) => {
      return Object.keys(filteredInfo).every((key) => {
        if (!filteredInfo[key] || filteredInfo[key].length === 0) return true;

        let itemValue = item[key];
        if (key === "inwardDate" && itemValue) {
          itemValue = dayjs(itemValue).format("DD-MM-YYYY");
        }

        return filteredInfo[key].includes(itemValue);
      });
    });
  };

  const filteredData = getFilteredData();

  const totals =
    totalsProp ||
    filteredData.reduce(
      (acc, item) => ({
        inwardKgs: acc.inwardKgs + (Number(item.inwardKgs) || 0),
        processKgs: acc.processKgs + (Number(item.processKgs) || 0),
        dcKgs: acc.dcKgs + (Number(item.dcKgs) || 0),
        returnKgs: acc.returnKgs + (Number(item.returnKgs) || 0),
        balanceKgs: acc.balanceKgs + (Number(item.balanceKgs) || 0),
      }),
      { inwardKgs: 0, processKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 },
    );

  return (
    <>
      <style>{`
        .compact-table-${tableId} .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .compact-table-${tableId} .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
        }
        .compact-table-${tableId} .ant-table-tbody > tr {
          height: auto !important;
        }
        .compact-table-${tableId} .ant-table-container table {
  border-collapse: collapse; /* ensures no gaps */
}

.compact-table-${tableId} .ant-table-thead > tr > th {
  border-bottom: 1px solid #d9d9d9 !important;
  padding: 6px 8px !important;
}

.compact-table-${tableId} .ant-table-tbody > tr > td {
  padding: 4px 8px !important;
}

.compact-table-${tableId} .ant-table-tbody > tr:first-child > td {
  border-top: none !important; /* let table collapse naturally */
}
        .compact-table-${tableId} .ant-table-container {
          border: none !important;
        }
        .compact-table-${tableId} .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
        .compact-table-${tableId} .ant-space-item {
          line-height: 1 !important;
        }
        .compact-table-${tableId} .ant-table-filter-trigger {
          display: inline-flex !important;
          align-items: center !important;
          margin-left: 4px !important;
          font-size: 12px !important;
          color: #bfbfbf !important;
          cursor: pointer !important;
        }
        .compact-table-${tableId} .ant-table-filter-trigger:hover {
          color: #1890ff !important;
        }
        .compact-table-${tableId} .ant-table-filter-trigger.active {
          color: #1890ff !important;
        }
        .compact-table-${tableId} .ant-table-column-has-sorters {
          cursor: pointer !important;
        }
      `}</style>

      {hiddenColumns.length > 0 && (
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            backgroundColor: "#f0f0f0",
            borderRadius: 4,
          }}
        >
          <span style={{ marginRight: 8, fontSize: "12px", color: "#666" }}>
            Hidden columns:
          </span>
          {hiddenColumns.map((columnKey) => (
            <span
              key={columnKey}
              onClick={() => handleColumnShow(columnKey)}
              style={{
                cursor: "pointer",
                backgroundColor: "#1890ff",
                color: "white",
                padding: "2px 6px",
                borderRadius: 3,
                fontSize: "11px",
                marginRight: 4,
                display: "inline-block",
              }}
              title="Click to show column"
            >
              {columnKey} ×
            </span>
          ))}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        size="small"
        className={`compact-table-${tableId}`}
        onChange={handleTableChange}
        pagination={
          showPagination
            ? {
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }
            : false
        }
        scroll={{ x: 1200 }}
        summary={() => (
          <Table.Summary.Row
            style={{ backgroundColor: "#fafafa", fontWeight: 600 }}
          >
            <Table.Summary.Cell index={0} colSpan={9}>
              <strong>Total</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={9} align="right">
              <strong>{totals.inwardKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={10} align="right">
              <strong>{totals.processKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={11} align="right">
              <strong>{totals.dcKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={12} align="right">
              <strong>{totals.returnKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={13} align="right">
              <strong>{totals.balanceKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={14} />
          </Table.Summary.Row>
        )}
      />
    </>
  );
};

export default InwardSummaryTable;
