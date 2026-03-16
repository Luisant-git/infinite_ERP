import React, { useState } from 'react';
import {
  Table,
  Input,
  Checkbox,
  Button,
  Space,
} from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const InwardSummaryTable = ({ 
  data, 
  loading = false, 
  showPagination = true,
  tableId = 'default'
}) => {
  const [filteredInfo, setFilteredInfo] = useState({});
  const [searchText, setSearchText] = useState({});
  const [columnSearchText, setColumnSearchText] = useState({});

  const handleColumnSearch = (dataIndex, value) => {
    setColumnSearchText(prev => ({ 
      ...prev, 
      [dataIndex]: value 
    }));
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
        
        if (key === 'inwardDate' && itemValue) {
          itemValue = dayjs(itemValue).format('DD-MM-YYYY');
        }
        
        if (typeof itemValue === 'number') {
          itemValue = itemValue.toString();
        }
        
        return itemValue?.toString().toLowerCase().includes(searchValue.toLowerCase());
      });
    });
  };

  const handleTableChange = (pagination, filters) => {
    setFilteredInfo(filters);
  };

  const getColumnSearchProps = (dataIndex, title) => {
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
        return index + 1;
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

  const SearchRow = () => {
    const handleInputChange = (dataIndex, e) => {
      e.preventDefault();
      e.stopPropagation();
      handleColumnSearch(dataIndex, e.target.value);
    };

    return (
      <tr className="search-row" style={{ backgroundColor: '#f5f5f5' }}>
        <td style={{ padding: '4px' }}></td>
        {columns.slice(1).map((col) => (
          <td key={`search-${tableId}-${col.key}`} style={{ padding: '4px', borderBottom: '1px solid #d9d9d9' }}>
            <Input
              key={`input-${tableId}-${col.key}`}
              placeholder={`Search...`}
              value={columnSearchText[col.dataIndex] || ''}
              onChange={(e) => handleInputChange(col.dataIndex, e)}
              size="small"
              allowClear
              style={{ width: '100%', fontSize: '11px', height: '24px' }}
              onPressEnter={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
            />
          </td>
        ))}
      </tr>
    );
  };

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
    <>
      <style>{`
        .compact-table-${tableId} {
          border-collapse: collapse !important;
        }
        .compact-table-${tableId} .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border-bottom: 0 !important;
          line-height: 1.2 !important;
          height: auto !important;
        }
        .compact-table-${tableId} .ant-table-tbody > tr > td {
          padding: 4px 8px !important;
          font-size: 12px !important;
          border-top: 0 !important;
          line-height: 1.2 !important;
        }
        .compact-table-${tableId} .ant-table-tbody > tr {
          height: 32px !important;
        }
        .compact-table-${tableId} .ant-table-tbody > tr:first-child > td {
          border-top: 0 !important;
          padding-top: 4px !important;
        }
        .compact-table-${tableId} .ant-btn-link {
          padding: 0 4px !important;
          height: 24px !important;
        }
        .compact-table-${tableId} .ant-space-item {
          line-height: 1 !important;
        }
        .compact-table-${tableId} .ant-table {
          margin: 0 !important;
          border-spacing: 0 !important;
        }
        .compact-table-${tableId} .ant-table-container {
          border-top: none !important;
        }
        .compact-table-${tableId} .ant-table-content {
          margin: 0 !important;
        }
        .compact-table-${tableId} .ant-table-thead {
          margin-bottom: 0 !important;
        }
        .compact-table-${tableId} .ant-table-tbody {
          margin-top: 0 !important;
        }
        .compact-table-${tableId} .ant-table-thead th {
          position: relative !important;
        }
        .compact-table-${tableId} .ant-table-thead th::after {
          display: none !important;
        }
        .compact-table-${tableId} table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
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
        .compact-table-${tableId} .ant-table-tbody > tr.search-row:hover > td {
          background-color: #f5f5f5 !important;
        }
      `}</style>
      
      <Table
        columns={columns}
        dataSource={[
          { id: 'search-row', isSearchRow: true },
          ...filteredData
        ]}
        rowKey={(record) => record.isSearchRow ? 'search-row' : record.id}
        loading={loading}
        size="small"
        className={`compact-table-${tableId}`}
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
        pagination={showPagination ? {
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        } : false}
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
    </>
  );
};

export default InwardSummaryTable;