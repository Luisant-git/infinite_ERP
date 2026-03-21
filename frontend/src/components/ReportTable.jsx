import React, { useState } from "react";
import { Table, Input, Checkbox, Button, Space } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const ReportTable = ({
  data,
  columns: propColumns,
  loading = false,
  showPagination = true,
  tableId = "default",
  summary,
  scroll = { x: 1200 },
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
            if (
              (dataIndex.toLowerCase().includes("date") ||
                dataIndex === "inwardDate" ||
                dataIndex === "dcDate") &&
              value
            ) {
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
          style={{ color: filtered ? "#ffff00" : "white", fontSize: "12px" }}
        />
      ),
      onFilter: (value, record) => {
        const recordValue =
          (dataIndex.toLowerCase().includes("date") ||
            dataIndex === "inwardDate" ||
            dataIndex === "dcDate") &&
          record[dataIndex]
            ? dayjs(record[dataIndex]).format("DD-MM-YYYY")
            : record[dataIndex];
        return recordValue === value;
      },
      filteredValue: filteredInfo[dataIndex] || null,
    };
  };

  const processedColumns = propColumns.map((col) => {
    if (col.searchable) {
      return {
        ...col,
        ...getColumnSearchProps(col.dataIndex, col.title),
        title: (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {col.title}
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleColumnHide(col.key || col.dataIndex);
              }}
              style={{ cursor: "pointer", color: "#ff4d4f", marginLeft: 4 }}
              title="Hide column"
            >
              ×
            </span>
          </div>
        ),
      };
    }
    return col;
  });

  const finalColumns = processedColumns.filter(
    (col) => !hiddenColumns.includes(col.key || col.dataIndex),
  );

  const getFilteredData = () => {
    if (!filteredInfo || Object.keys(filteredInfo).length === 0) {
      return data;
    }

    return data.filter((item) => {
      return Object.keys(filteredInfo).every((key) => {
        if (!filteredInfo[key] || filteredInfo[key].length === 0) return true;

        let itemValue = item[key];
        if (
          (key.toLowerCase().includes("date") ||
            key === "inwardDate" ||
            key === "dcDate") &&
          itemValue
        ) {
          itemValue = dayjs(itemValue).format("DD-MM-YYYY");
        }

        return filteredInfo[key].includes(itemValue);
      });
    });
  };

  const filteredData = getFilteredData();

  return (
    <>
      <style>{`
        .compact-table-${tableId} .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          background-color: var(--primary-color) !important;
          color: white !important;
        }
        .compact-table-${tableId} .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 11px !important;
        }
        .compact-table-${tableId} .ant-table-tbody > tr {
          height: auto !important;
        }
        .compact-table-${tableId} .ant-table-container table {
          border-collapse: collapse;
        }
        .compact-table-${tableId} .ant-table-thead > tr > th {
          border-bottom: 1px solid #d9d9d9 !important;
        }
        .compact-table-${tableId} .ant-table-container {
          border: none !important;
        }
        .compact-table-${tableId} .ant-table-filter-trigger {
          display: inline-flex !important;
          align-items: center !important;
          margin-left: 4px !important;
          font-size: 11px !important;
          color: #bfbfbf !important;
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
          <span style={{ marginRight: 8, fontSize: "11px", color: "#666" }}>
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
        columns={finalColumns}
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
                pageSizeOptions: ["10", "20", "50", "100", "500"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }
            : false
        }
        scroll={scroll}
        summary={() => summary && summary(filteredData)}
      />
    </>
  );
};

export default ReportTable;
