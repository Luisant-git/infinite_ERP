import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Button,
  Typography,
  Space,
  message,
  Input,
  Checkbox,
} from 'antd';
import {
  SearchOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getInwardSummary } from '../../api/inwardSummary';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const InwardSummary = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [filteredInfo, setFilteredInfo] = useState({});
  const [searchText, setSearchText] = useState({});
  const [columnSearchText, setColumnSearchText] = useState({});

  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return;
    }

    setLoading(true);
    try {
      const params = {
        fromDate: dateRange[0].toISOString(),
        toDate: dateRange[1].toISOString(),
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const response = await getInwardSummary(params);
      setData(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
      }));
    } catch (error) {
      message.error('Failed to load inward summary data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning('Please select date range');
      return;
    }
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData();
  };



  const handleExport = () => {
    // Create CSV content
    const headers = ['S.No', 'Inward No', 'Inward Date', 'PDC No', 'Order No', 'Fabric', 'Dia', 'Color', 'Inward Kgs', 'DC Kgs', 'Return Kgs', 'Balance Kgs', 'UOM'];
    
    const csvData = filteredData.map((item, index) => [
      index + 1,
      item.inwardNo,
      dayjs(item.inwardDate).format('DD-MM-YYYY'),
      item.pdcNo,
      item.orderNo,
      item.fabric,
      item.dia,
      item.color,
      Number(item.inwardKgs).toFixed(3),
      Number(item.dcKgs).toFixed(3),
      Number(item.returnKgs).toFixed(3),
      Number(item.balanceKgs).toFixed(3),
      item.uom,
    ]);

    // Add totals row
    csvData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Total',
      totals.inwardKgs.toFixed(3),
      totals.dcKgs.toFixed(3),
      totals.returnKgs.toFixed(3),
      totals.balanceKgs.toFixed(3),
      '',
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Inward_Summary_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('CSV exported successfully');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inward Summary Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h2 {
              text-align: center;
              margin-bottom: 10px;
            }
            .date-range {
              text-align: center;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            th {
              background-color: #4472c4;
              color: white;
              padding: 6px 4px;
              text-align: left;
              border: 1px solid #ddd;
              font-size: 10px;
            }
            td {
              padding: 4px;
              border: 1px solid #ddd;
              font-size: 10px;
            }
            tr {
              page-break-inside: avoid;
            }
            tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .text-right {
              text-align: right;
            }
            tfoot td {
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 6px 4px;
            }
            @media print {
              body { 
                margin: 10px;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
              tr {
                page-break-inside: avoid;
              }
              h2 {
                page-break-after: avoid;
              }
              .date-range {
                page-break-after: avoid;
              }
            }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          <h2>Inward Summary Report</h2>
          <div class="date-range">
            Period: ${dateRange[0].format('DD-MM-YYYY')} to ${dateRange[1].format('DD-MM-YYYY')}
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Inward No</th>
                <th>Inward Date</th>
                <th>PDC No</th>
                <th>Order No</th>
                <th>Fabric</th>
                <th>Dia</th>
                <th>Color</th>
                <th class="text-right">Inward Kgs</th>
                <th class="text-right">DC Kgs</th>
                <th class="text-right">Return Kgs</th>
                <th class="text-right">Balance Kgs</th>
                <th>UOM</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.inwardNo}</td>
                  <td>${dayjs(item.inwardDate).format('DD-MM-YYYY')}</td>
                  <td>${item.pdcNo}</td>
                  <td>${item.orderNo}</td>
                  <td>${item.fabric}</td>
                  <td>${item.dia}</td>
                  <td>${item.color}</td>
                  <td class="text-right">${Number(item.inwardKgs).toFixed(3)}</td>
                  <td class="text-right">${Number(item.dcKgs).toFixed(3)}</td>
                  <td class="text-right">${Number(item.returnKgs).toFixed(3)}</td>
                  <td class="text-right">${Number(item.balanceKgs).toFixed(3)}</td>
                  <td>${item.uom}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8">Total</td>
                <td class="text-right">${totals.inwardKgs.toFixed(3)}</td>
                <td class="text-right">${totals.dcKgs.toFixed(3)}</td>
                <td class="text-right">${totals.returnKgs.toFixed(3)}</td>
                <td class="text-right">${totals.balanceKgs.toFixed(3)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleColumnSearch = (dataIndex, value) => {
    setColumnSearchText(prev => ({ ...prev, [dataIndex]: value }));
  };

  const getFilteredDataByColumnSearch = () => {
    if (!columnSearchText || Object.keys(columnSearchText).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.keys(columnSearchText).every(key => {
        const searchValue = columnSearchText[key];
        if (!searchValue) return true;
        
        let itemValue = item[key];
        
        // Handle date formatting
        if (key === 'inwardDate' && itemValue) {
          itemValue = dayjs(itemValue).format('DD-MM-YYYY');
        }
        
        // Handle numeric values
        if (typeof itemValue === 'number') {
          itemValue = itemValue.toString();
        }
        
        return itemValue?.toString().toLowerCase().includes(searchValue.toLowerCase());
      });
    });
  };

  const handleTableChange = (pagination, filters) => {
    setFilteredInfo(filters);
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
    });
  };

  const getColumnSearchProps = (dataIndex, title) => {
    // For date columns, format the values for display
    const uniqueValues = [...new Set(data.map(item => {
      const value = item[dataIndex];
      if (dataIndex === 'inwardDate' && value) {
        return dayjs(value).format('DD-MM-YYYY');
      }
      return value;
    }).filter(Boolean))];
    
    const currentSearch = searchText[dataIndex] || '';
    
    const filteredValues = uniqueValues.filter(value =>
      value.toString().toLowerCase().includes(currentSearch.toLowerCase())
    );

    return {
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8, width: 250 }}>
          <Input
            placeholder={`Search ${title}`}
            value={currentSearch}
            onChange={(e) => {
              setSearchText(prev => ({ ...prev, [dataIndex]: e.target.value }));
            }}
            style={{ marginBottom: 8, display: 'block' }}
            size="small"
          />
          <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 8 }}>
            <Checkbox
              indeterminate={selectedKeys.length > 0 && selectedKeys.length < uniqueValues.length}
              checked={selectedKeys.length === uniqueValues.length && uniqueValues.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedKeys(uniqueValues);
                } else {
                  setSelectedKeys([]);
                }
              }}
              style={{ marginBottom: 4, fontWeight: 600 }}
            >
              Select All
            </Checkbox>
            {filteredValues.map(value => (
              <div key={value} style={{ marginBottom: 4 }}>
                <Checkbox
                  checked={selectedKeys.includes(value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedKeys([...selectedKeys, value]);
                    } else {
                      setSelectedKeys(selectedKeys.filter(key => key !== value));
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
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Filter
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                setSearchText(prev => ({ ...prev, [dataIndex]: '' }));
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) => {
        const recordValue = dataIndex === 'inwardDate' && record[dataIndex]
          ? dayjs(record[dataIndex]).format('DD-MM-YYYY')
          : record[dataIndex];
        return recordValue === value;
      },
      filteredValue: filteredInfo[dataIndex] || null,
    };
  };

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, record, index) => {
        if (record.isSearchRow) return '';
        return (pagination.current - 1) * pagination.pageSize + index;
      },
    },
    {
      title: 'Inward No',
      dataIndex: 'inwardNo',
      key: 'inwardNo',
      width: 100,
      ...getColumnSearchProps('inwardNo', 'Inward No'),
    },
    {
      title: 'Inward Date',
      dataIndex: 'inwardDate',
      key: 'inwardDate',
      width: 110,
      render: (date) => dayjs(date).format('DD-MM-YYYY'),
      ...getColumnSearchProps('inwardDate', 'Inward Date'),
    },
    {
      title: 'PDC No',
      dataIndex: 'pdcNo',
      key: 'pdcNo',
      width: 100,
      ...getColumnSearchProps('pdcNo', 'PDC No'),
    },
    {
      title: 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 100,
      ...getColumnSearchProps('orderNo', 'Order No'),
    },
    {
      title: 'Fabric',
      dataIndex: 'fabric',
      key: 'fabric',
      width: 120,
      ...getColumnSearchProps('fabric', 'Fabric'),
    },
    {
      title: 'Dia',
      dataIndex: 'dia',
      key: 'dia',
      width: 80,
      ...getColumnSearchProps('dia', 'Dia'),
    },
    {
      title: 'Color',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      ...getColumnSearchProps('color', 'Color'),
    },
    {
      title: 'Inward Kgs',
      dataIndex: 'inwardKgs',
      key: 'inwardKgs',
      width: 100,
      align: 'right',
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps('inwardKgs', 'Inward Kgs'),
    },
    {
      title: 'DC Kgs',
      dataIndex: 'dcKgs',
      key: 'dcKgs',
      width: 100,
      align: 'right',
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps('dcKgs', 'DC Kgs'),
    },
    {
      title: 'Return Kgs',
      dataIndex: 'returnKgs',
      key: 'returnKgs',
      width: 100,
      align: 'right',
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps('returnKgs', 'Return Kgs'),
    },
    {
      title: 'Balance Kgs',
      dataIndex: 'balanceKgs',
      key: 'balanceKgs',
      width: 100,
      align: 'right',
      render: (qty) => Number(qty).toFixed(3),
      ...getColumnSearchProps('balanceKgs', 'Balance Kgs'),
    },
    {
      title: 'UOM',
      dataIndex: 'uom',
      key: 'uom',
      width: 120,
      ...getColumnSearchProps('uom', 'UOM'),
    },
  ];

  // Search row component - now as a body row
  const SearchRow = () => (
    <tr className="search-row" style={{ backgroundColor: '#f5f5f5' }}>
      <td style={{ padding: '4px' }}></td>
      {columns.slice(1).map((col) => (
        <td key={col.key} style={{ padding: '4px', borderBottom: '1px solid #d9d9d9' }}>
          <Input
            placeholder={`Search...`}
            value={columnSearchText[col.dataIndex] || ''}
            onChange={(e) => handleColumnSearch(col.dataIndex, e.target.value)}
            size="small"
            allowClear
            style={{ width: '100%', fontSize: '11px', height: '24px' }}
          />
        </td>
      ))}
    </tr>
  );

  // Calculate totals from filtered data
  const getFilteredData = () => {
    let filtered = getFilteredDataByColumnSearch();
    
    if (filteredInfo && Object.keys(filteredInfo).length > 0) {
      filtered = filtered.filter(item => {
        return Object.keys(filteredInfo).every(key => {
          if (!filteredInfo[key] || filteredInfo[key].length === 0) return true;
          
          let itemValue = item[key];
          if (key === 'inwardDate' && itemValue) {
            itemValue = dayjs(itemValue).format('DD-MM-YYYY');
          }
          
          return filteredInfo[key].includes(itemValue);
        });
      });
    }
    
    return filtered;
  };

  const filteredData = getFilteredData();

  const totals = filteredData.reduce(
    (acc, item) => ({
      inwardKgs: acc.inwardKgs + (Number(item.inwardKgs) || 0),
      dcKgs: acc.dcKgs + (Number(item.dcKgs) || 0),
      returnKgs: acc.returnKgs + (Number(item.returnKgs) || 0),
      balanceKgs: acc.balanceKgs + (Number(item.balanceKgs) || 0),
    }),
    { inwardKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 }
  );

  return (
    <Card>
      <style>{`
        .compact-table {
          border-collapse: collapse !important;
        }
        .compact-table .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border-bottom: 0 !important;
          line-height: 1.2 !important;
          height: auto !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
          border-top: 0 !important;
          line-height: 1.2 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: 32px !important;
        }
        .compact-table .ant-table-tbody > tr:first-child > td {
          border-top: 0 !important;
          padding-top: 4px !important;
        }
        .compact-table .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
        .compact-table .ant-space-item {
          line-height: 1 !important;
        }
        .compact-table .ant-table {
          margin: 0 !important;
          border-spacing: 0 !important;
        }
        .compact-table .ant-table-container {
          border-top: none !important;
        }
        .compact-table .ant-table-content {
          margin: 0 !important;
        }
        .compact-table .ant-table-thead {
          margin-bottom: 0 !important;
        }
        .compact-table .ant-table-tbody {
          margin-top: 0 !important;
        }
        .compact-table .ant-table-thead th {
          position: relative !important;
        }
        .compact-table .ant-table-thead th::after {
          display: none !important;
        }
        .compact-table table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
        }
        .compact-table .ant-table-filter-trigger {
          display: inline-flex !important;
          align-items: center !important;
          margin-left: 4px !important;
          font-size: 12px !important;
          color: #bfbfbf !important;
          cursor: pointer !important;
        }
        .compact-table .ant-table-filter-trigger:hover {
          color: #1890ff !important;
        }
        .compact-table .ant-table-filter-trigger.active {
          color: #1890ff !important;
        }
        .compact-table .ant-table-column-has-sorters {
          cursor: pointer !important;
        }
        .search-row {
          background-color: #f5f5f5 !important;
        }
        .search-row td {
          padding: 4px !important;
          border-bottom: 1px solid #d9d9d9 !important;
          border-top: 1px solid #d9d9d9 !important;
          line-height: 1 !important;
        }
        .search-row .ant-input {
          height: 24px !important;
          font-size: 11px !important;
        }
        .compact-table .ant-table-tbody > tr.search-row:hover > td {
          background-color: #f5f5f5 !important;
        }
      `}</style>
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Inward Summary Report
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD-MM-YYYY"
            style={{ width: 280 }}
            size="small"
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            Search
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            disabled={data.length === 0}
          >
            Export
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={data.length === 0}
          >
            Print
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={[
          { id: 'search-row', isSearchRow: true },
          ...filteredData
        ]}
        rowKey={(record) => record.isSearchRow ? 'search-row' : record.id}
        loading={loading}
        size="small"
        className="compact-table"
        onChange={handleTableChange}
        rowClassName={(record) => record.isSearchRow ? 'search-row' : ''}
        components={{
          body: {
            row: (props) => {
              if (props.className?.includes('search-row')) {
                return <SearchRow />;
              }
              return <tr {...props} />;
            },
          },
        }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          },
        }}
        scroll={{ x: 1200 }}
        summary={() => (
          <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 600 }}>
            <Table.Summary.Cell index={0} colSpan={8}>
              <strong>Total</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8} align="right">
              <strong>{totals.inwardKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={9} align="right">
              <strong>{totals.dcKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={10} align="right">
              <strong>{totals.returnKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={11} align="right">
              <strong>{totals.balanceKgs.toFixed(3)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={12} />
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default InwardSummary;