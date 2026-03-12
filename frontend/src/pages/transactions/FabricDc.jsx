import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Select, DatePicker, Table, Modal, InputNumber, message, Space, Radio, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import { getNextDcNo, getFabricDcs, createFabricDc, updateFabricDc, deleteFabricDc } from '../../api/fabricDc';
import { getParties } from '../../api/party';
import { getFabricInwards } from '../../api/fabricInward';
import { getMastersByType } from '../../api/fabricInward';
import { getSettings } from '../../api/settings';
import { getConcerns } from '../../api/concern';
import { useMenuPermissions } from '../../hooks/useMenuPermissions';
import { useSelector } from 'react-redux';
import FabricDCPrint from '../../components/prints/FabricDCPrint';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FabricDc = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fabricDcs, setFabricDcs] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { adminUser: isAdmin, canAdd, canEdit, canDelete } = useMenuPermissions();
  const { selectedCompany, selectedYear } = useSelector(state => state.auth);
  const printRef = useRef();
  
  const [parties, setParties] = useState([]);
  const [allParties, setAllParties] = useState([]);
  const [inwards, setInwards] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);
  const [dias, setDias] = useState([]);
  const [uoms, setUoms] = useState([]);
  
  const [details, setDetails] = useState([]);
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [dcType, setDcType] = useState('Production');
  const [fabricType, setFabricType] = useState('');
  const [inwardQty, setInwardQty] = useState(0);
  const [pendingInward, setPendingInward] = useState(0);
  const [balance, setBalance] = useState(0);
  const [inwardDetails, setInwardDetails] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [enableItemWiseProcess, setEnableItemWiseProcess] = useState(false);
  const [concernData, setConcernData] = useState(null);

  useEffect(() => {
    loadData();
    loadMasters();
    loadAllInwards();
    loadSettings();
    loadConcernData();
  }, [selectedCompany]);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setEnableItemWiseProcess(settings.enableItemWiseProcess || false);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadConcernData = async () => {
    try {
      const concernId = localStorage.getItem('selectedCompanyId');
      if (concernId) {
        const response = await getConcerns('', 1, 1000);
        const concern = response.data?.find(c => c.id === parseInt(concernId));
        setConcernData(concern || null);
      }
    } catch (error) {
      console.error('Error loading concern data:', error);
    }
  };

  const loadAllInwards = async () => {
    try {
      const response = await getFabricInwards('', 1, 1000);
      const filtered = (response.data || []).filter(i => i.isClosed === 0 || i.isClosed === false);
      setInwards(filtered);
    } catch (error) {
      console.error('Error loading inwards:', error);
    }
  };

  const loadData = async () => {
    try {
      const response = await getFabricDcs('', 1, 100);
      setFabricDcs(response.data || []);
    } catch (error) {
      console.error('Error loading fabric DCs:', error);
    }
  };

  const loadMasters = async () => {
    try {
      const [partiesRes, fabricsRes, colorsRes, diasRes, uomsRes] = await Promise.all([
        getParties('', 1, 1000),
        getMastersByType('Fabric', true),
        getMastersByType('Color', true),
        getMastersByType('Dia', true),
        getMastersByType('UOM', true)
      ]);
      
      const allPartiesData = partiesRes.data || [];
      setAllParties(allPartiesData);
      setParties(allPartiesData.filter(p => p.partyTypes?.some(pt => 
        pt.partyType.partyTypeName.toLowerCase() === 'customer'
      )));
      
      setFabrics(fabricsRes || []);
      setColors(colorsRes || []);
      setDias(diasRes || []);
      setUoms(uomsRes || []);
    } catch (error) {
      console.error('Error loading masters:', error);
    }
  };

  const loadInwards = async (partyId) => {
    try {
      const response = await getFabricInwards('', 1, 1000);
      const filtered = (response.data || []).filter(i => 
        i.partyId === partyId && (i.isClosed === 0 || i.isClosed === false)
      );
      setInwards(filtered);
      form.setFieldsValue({ deliveryTo: partyId });
      console.log('Loaded inwards for party:', partyId, filtered);
    } catch (error) {
      console.error('Error loading inwards:', error);
    }
  };

  const handleNew = async () => {
    try {
      const response = await getNextDcNo();
      form.resetFields();
      form.setFieldsValue({
        dcNo: response.dcNo,
        dcDate: dayjs(),
        isFinal: 0
      });
      setDetails([]);
      setSelectedProcesses([]);
      setDcType('Fresh');
      setEditingId(null);
      setIsViewMode(false);
      setInwards([]);
      setIsFormVisible(true);
    } catch (error) {
      message.error('Failed to generate DC number');
    }
  };

  const handleView = async (record) => {
    setEditingId(record.id);
    setIsViewMode(true);
    
    const dyeParty = allParties.find(p => p.id === record.dyeParty);
    const isFinal = Boolean(record.isFinal);
    const party = allParties.find(p => p.id === record.deliveryTo);
    const firstDetail = record.details?.[0] || {};
    
    // Fetch inward data fresh
    const inwardResponse = await getFabricInwards('', 1, 1000);
    const allInwards = inwardResponse.data || [];
    const selectedInward = allInwards.find(i => i.grnNo === record.inwardNo);
    
    if (selectedInward) {
      setInwardQty(Number(selectedInward.totalQty) || 0);
      setInwardDetails(selectedInward.details || []);
      
      const [dcResponse, returnResponse] = await Promise.all([
        getFabricDcs('', 1, 1000),
        import('../../api/fabricReturn').then(m => m.getFabricReturns('', 1, 1000))
      ]);
      
      const allDcs = dcResponse.data || [];
      const allReturns = returnResponse.data || [];
      
      const existingDcs = allDcs.filter(dc => dc.inwardNo === record.inwardNo && dc.id !== record.id);
      const existingReturns = allReturns.filter(ret => ret.inwardNo === record.inwardNo);
      
      const usedInDc = existingDcs.reduce((sum, dc) => sum + (Number(dc.totalQty) || 0), 0);
      const usedInReturn = existingReturns.reduce((sum, ret) => sum + (Number(ret.totalQty) || 0), 0);
      
      setPendingInward(Number(selectedInward.totalQty) - usedInDc - usedInReturn);
      setBalance(Number(selectedInward.totalQty) - usedInDc - usedInReturn);
    }
    
    // Set print data for view mode
    let processText = '';
    if (enableItemWiseProcess) {
      // When item-wise process is enabled, get processes from item details
      const itemProcesses = new Set();
      (record.details || []).forEach(d => {
        if (d.processes) {
          try {
            const processes = JSON.parse(d.processes);
            processes.forEach(p => itemProcesses.add(p));
          } catch (e) {
            console.error('Error parsing item processes:', e);
          }
        }
      });
      processText = Array.from(itemProcesses).join(', ');
    } else {
      // Use main record processes
      processText = record.processes?.map(p => p.processName).join(', ') || '';
    }
    
    setPrintData({
      dcNo: record.dcNo,
      dcDate: record.dcDate,
      partyName: party?.partyName || '',
      address1: party?.address1 || '',
      address2: party?.address2 || '',
      address3: party?.address3 || '',
      address4: party?.address4 || '',
      district: party?.district || '',
      phoneNo: party?.phoneNo || '',
      mobileNo: party?.mobileNo || '',
      mailId: party?.email || '',
      gstNo: party?.gstNo || '',
      dyeParty: dyeParty?.partyName || '-',
      dyeDcNo: record.dyeingDcNo || '',
      pdcNo: record.pdcNo || '',
      orderNo: record.orderNo || '',
      jobNo: record.inwardNo || '',
      recWeight: Number(inwards.find(i => i.grnNo === record.inwardNo)?.totalQty || 0).toFixed(3),
      items: (record.details || []).map(d => ({
        fabric: fabrics.find(f => f.id === d.fabricId)?.masterName || '-',
        color: colors.find(c => c.id === d.colorId)?.masterName || '-',
        dia: dias.find(dia => dia.id === d.diaId)?.masterName || '-',
        rolls: d.rolls || 0,
        weight: Number(d.dcWeight || 0).toFixed(3),
        processes: d.processes,
        designName: d.designName,
        remarks: d.remarks || ''
      })),
      process: processText,
      vehicleNo: record.vehicleNo || '',
      remarks: record.remarks || '-',
      concernName: concernData?.partyName,
      concernAddr1: concernData?.address1,
      concernAddr2: concernData?.address2,
      concernAddr3: concernData?.address3,
      concernAddr4: concernData?.address4,
      concernDistrict: concernData?.district,
      concernPhoneNo: concernData?.phoneNo,
      concernMobileNo: concernData?.mobileNo,
      concernMailId: concernData?.email,
      concernGstNo: concernData?.gstNo,
      enableItemWiseProcess: enableItemWiseProcess
    });
    
    form.setFieldsValue({
      ...record,
      grnNo: record.inwardNo,
      dcDate: dayjs(record.dcDate),
      grnDate: record.grnDate ? dayjs(record.grnDate) : null,
      dyeingDcDate: record.dyeingDcDate ? dayjs(record.dyeingDcDate) : null,
      dyeingPartyName: dyeParty?.partyName || '',
      isFinal
    });
    setDetails(record.details?.map(d => {
      return {
        ...d, 
        key: d.id,
        inwardDetailId: d.inwardDetailId,
        inwardWeight: d.processWeight || 0,
        weightLoss: (d.processWeight || 0) - (d.dcWeight || 0),
        lossPercentage: (d.processWeight || 0) > 0 ? (((d.processWeight || 0) - (d.dcWeight || 0)) / (d.processWeight || 0) * 100) : 0,
        processes: d.processes ? JSON.parse(d.processes) : []
      };
    }) || []);
    setSelectedProcesses(record.processes?.map(p => ({ ...p, key: p.id })) || []);
    setDcType(record.dcType || 'Fresh');
    setFabricType(record.fabricType || '');
    setIsFormVisible(true);
  };

  const handleEdit = async (record) => {
    setEditingId(record.id);
    setIsViewMode(false);
    
    const dyeParty = allParties.find(p => p.id === record.dyeParty);
    const isFinal = Boolean(record.isFinal);
    
    // Fetch inward data fresh
    const inwardResponse = await getFabricInwards('', 1, 1000);
    const allInwards = inwardResponse.data || [];
    const selectedInward = allInwards.find(i => i.grnNo === record.inwardNo);
    
    if (selectedInward) {
      setInwardQty(Number(selectedInward.totalQty) || 0);
      setInwardDetails(selectedInward.details || []);
      
      const [dcResponse, returnResponse] = await Promise.all([
        getFabricDcs('', 1, 1000),
        import('../../api/fabricReturn').then(m => m.getFabricReturns('', 1, 1000))
      ]);
      
      const allDcs = dcResponse.data || [];
      const allReturns = returnResponse.data || [];
      
      const existingDcs = allDcs.filter(dc => dc.inwardNo === record.inwardNo && dc.id !== record.id);
      const existingReturns = allReturns.filter(ret => ret.inwardNo === record.inwardNo);
      
      const usedInDc = existingDcs.reduce((sum, dc) => sum + (Number(dc.totalQty) || 0), 0);
      const usedInReturn = existingReturns.reduce((sum, ret) => sum + (Number(ret.totalQty) || 0), 0);
      
      setPendingInward(Number(selectedInward.totalQty) - usedInDc - usedInReturn);
      setBalance(Number(selectedInward.totalQty) - usedInDc - usedInReturn);
    }
    
    form.setFieldsValue({
      ...record,
      grnNo: record.inwardNo,
      dcDate: dayjs(record.dcDate),
      grnDate: record.grnDate ? dayjs(record.grnDate) : null,
      dyeingDcDate: record.dyeingDcDate ? dayjs(record.dyeingDcDate) : null,
      dyeingPartyName: dyeParty?.partyName || '',
      isFinal
    });
    setDetails(record.details?.map(d => {
      return {
        ...d, 
        key: d.id,
        inwardDetailId: d.inwardDetailId,
        inwardWeight: d.processWeight || 0,
        weightLoss: (d.processWeight || 0) - (d.dcWeight || 0),
        lossPercentage: (d.processWeight || 0) > 0 ? (((d.processWeight || 0) - (d.dcWeight || 0)) / (d.processWeight || 0) * 100) : 0,
        processes: d.processes ? JSON.parse(d.processes) : []
      };
    }) || []);
    setSelectedProcesses(record.processes?.map(p => ({ ...p, key: p.id })) || []);
    setDcType(record.dcType || 'Fresh');
    setFabricType(record.fabricType || '');
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Fabric DC',
      content: 'Are you sure?',
      onOk: async () => {
        try {
          await deleteFabricDc(id);
          message.success('Deleted successfully');
          loadData();
        } catch (error) {
          message.error('Failed to delete');
        }
      }
    });
  };

  const handleSubmit = async (shouldPrint = false) => {
    try {
      const values = await form.validateFields();
      
      const trimmedDcNo = values.dcNo?.trim();
      if (!trimmedDcNo) {
        message.error('DC number is required!');
        return;
      }
      
      if (details.length === 0) {
        message.error('Please add at least one detail row');
        return;
      }
      
      const hasInvalidProcessWeight = details.some(d => 
        (Number(d.processWeight) || 0) <= 0
      );
      
      if (hasInvalidProcessWeight) {
        message.error('Process Weight must be greater than 0!');
        return;
      }
      
      const hasValidWeight = details.some(d => 
        (Number(d.processWeight) || 0) > 0 || (Number(d.dcWeight) || 0) > 0
      );
      
      if (!hasValidWeight) {
        message.error('Cannot save! Process Weight & DC Weight cannot be 0');
        return;
      }
      
      const dcResponse = await getFabricDcs('', 1, 1000);
      const allDcs = dcResponse.data || [];
      const duplicate = allDcs.find(f => f.dcNo?.trim() === trimmedDcNo && f.id !== editingId);
      if (duplicate) {
        message.error('DC number already exists!');
        return;
      }
      
      const inwardResponse = await getFabricInwards('', 1, 1000);
      const allInwards = inwardResponse.data || [];
      const duplicateInward = allInwards.find(i => i.grnNo?.trim() === trimmedDcNo);
      if (duplicateInward) {
        message.error('DC number already exists in Return Entry!');
        return;
      }
      
      setLoading(true);

      const totalQty = details.reduce((sum, d) => sum + (Number(d.dcWeight) || 0), 0);
      const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

      const { dyeingPartyName, dyeParty, ...submitValues } = values;

      const data = {
        ...submitValues,
        dcNo: trimmedDcNo,
        dyeParty: dyeParty || null,
        dcDate: values.dcDate?.toISOString(),
        grnDate: values.grnDate?.toISOString(),
        dyeingDcDate: values.dyeingDcDate?.toISOString(),
        dcType,
        isFinal: values.isFinal ? 1 : 0,
        inwardQty: values.inwardQty || null,
        pendingInward: values.pendingInward || null,
        totalQty,
        totalRolls,
        details: details.map(d => ({
          inwardDetailId: d.inwardDetailId,
          fabricId: d.fabricId,
          colorId: d.colorId,
          diaId: d.diaId,
          inwFabricId: d.inwFabricId,
          inwColorId: d.inwColorId,
          inwDiaId: d.inwDiaId,
          gsm: d.gsm,
          designNo: d.designNo,
          designName: d.designName,
          noOfColor: d.noOfColor,
          processWeight: Number(d.processWeight) || 0,
          dcWeight: Number(d.dcWeight) || 0,
          weightLoss: Number(d.weightLoss) || 0,
          lossPercentage: Number(d.lossPercentage) || 0,
          rolls: d.rolls || 0,
          uomId: d.uomId,
          rate: Number(d.rate) || 0,
          amount: Number(d.amount) || 0,
          processes: enableItemWiseProcess && d.processes ? JSON.stringify(d.processes) : null,
          remarks: d.remarks
        })),
        processes: selectedProcesses.map(p => ({
          processName: p.processName
        }))
      };

      let savedRecord;
      if (editingId) {
        savedRecord = await updateFabricDc(editingId, data);
        message.success('Updated successfully');
      } else {
        savedRecord = await createFabricDc(data);
        message.success('Created successfully');
      }
      
      if (shouldPrint) {
        const party = allParties.find(p => p.id === values.deliveryTo);
        
        setPrintData({
          dcNo: values.dcNo,
          dcDate: values.dcDate,
          partyName: party?.partyName || '',
          address1: party?.address1 || '',
          address2: party?.address2 || '',
          address3: party?.address3 || '',
          address4: party?.address4 || '',
          district: party?.district || '',
          phoneNo: party?.phoneNo || '',
          mobileNo: party?.mobileNo || '',
          mailId: party?.email || '',
          gstNo: party?.gstNo || '',
          dyeParty: values.dyeingPartyName || '-',
          dyeDcNo: values.dyeingDcNo || '',
          pdcNo: values.pdcNo || '',
          orderNo: values.orderNo || '',
          jobNo: values.grnNo || '',
          recWeight: (inwardQty || 0).toFixed(3),
          items: details.map(d => ({
            fabric: fabrics.find(f => f.id === d.fabricId)?.masterName || '-',
            color: colors.find(c => c.id === d.colorId)?.masterName || '-',
            dia: dias.find(dia => dia.id === d.diaId)?.masterName || '-',
            rolls: d.rolls || 0,
            weight: Number(d.dcWeight || 0).toFixed(3),
            processes: d.processes,
            designName: d.designName,
            remarks: d.remarks || ''
          })),
          process: selectedProcesses.map(p => p.processName).join(', '),
          vehicleNo: values.vehicleNo || '',
          remarks: values.remarks || '-',
          concernName: concernData?.partyName,
          concernAddr1: concernData?.address1,
          concernAddr2: concernData?.address2,
          concernAddr3: concernData?.address3,
          concernAddr4: concernData?.address4,
          concernDistrict: concernData?.district,
          concernPhoneNo: concernData?.phoneNo,
          concernMobileNo: concernData?.mobileNo,
          concernMailId: concernData?.email,
          concernGstNo: concernData?.gstNo,
          enableItemWiseProcess: enableItemWiseProcess
        });
        
        setTimeout(() => {
          handlePrint();
        }, 500);
      }
      
      setIsFormVisible(false);
      loadData();
    } catch (error) {
      message.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handlePrintRecord = (record) => {
    const party = allParties.find(p => p.id === record.deliveryTo);
    
    // Extract processes based on enableItemWiseProcess setting
    let processText = '';
    if (enableItemWiseProcess) {
      // When item-wise process is enabled, get processes from item details
      const itemProcesses = new Set();
      (record.details || []).forEach(d => {
        if (d.processes) {
          try {
            const processes = JSON.parse(d.processes);
            processes.forEach(p => itemProcesses.add(p));
          } catch (e) {
            console.error('Error parsing item processes:', e);
          }
        }
      });
      processText = Array.from(itemProcesses).join(', ');
    } else {
      // Use main record processes
      processText = record.processes?.map(p => p.processName).join(', ') || '';
    }
    
    setPrintData({
      dcNo: record.dcNo,
      dcDate: record.dcDate,
      partyName: party?.partyName || '',
      address1: party?.address1 || '',
      address2: party?.address2 || '',
      address3: party?.address3 || '',
      address4: party?.address4 || '',
      district: party?.district || '',
      phoneNo: party?.phoneNo || '',
      mobileNo: party?.mobileNo || '',
      mailId: party?.email || '',
      gstNo: party?.gstNo || '',
      dyeParty: allParties.find(p => p.id === record.dyeParty)?.partyName || '-',
      dyeDcNo: record.dyeingDcNo || '',
      pdcNo: record.pdcNo || '',
      orderNo: record.orderNo || '',
      jobNo: record.inwardNo || '',
      recWeight: Number(inwards.find(i => i.grnNo === record.inwardNo)?.totalQty || 0).toFixed(3),
      items: (record.details || []).map(d => ({
        fabric: fabrics.find(f => f.id === d.fabricId)?.masterName || '-',
        color: colors.find(c => c.id === d.colorId)?.masterName || '-',
        dia: dias.find(dia => dia.id === d.diaId)?.masterName || '-',
        rolls: d.rolls || 0,
        weight: Number(d.dcWeight || 0).toFixed(3),
        processes: d.processes,
        designName: d.designName,
        remarks: d.remarks || ''
      })),
      process: processText,
      vehicleNo: record.vehicleNo || '',
      remarks: record.remarks || '-',
      concernName: concernData?.partyName,
      concernAddr1: concernData?.address1,
      concernAddr2: concernData?.address2,
      concernAddr3: concernData?.address3,
      concernAddr4: concernData?.address4,
      concernDistrict: concernData?.district,
      concernPhoneNo: concernData?.phoneNo,
      concernMobileNo: concernData?.mobileNo,
      concernMailId: concernData?.email,
      concernGstNo: concernData?.gstNo,
      enableItemWiseProcess: enableItemWiseProcess
    });
    
    setTimeout(() => handlePrint(), 100);
  };

  const handleInwardSelect = async (inwardNo) => {
    const selectedInward = inwards.find(i => i.grnNo === inwardNo);
    if (selectedInward) {
      const dyeParty = allParties.find(p => p.id === selectedInward.dyeingPartyId);
      setFabricType(selectedInward.fabricType || '');
      
      const totalInwardQty = Number(selectedInward.totalQty) || 0;
      setInwardQty(totalInwardQty);
      
      // Fetch fresh DC and Return data
      const [dcResponse, returnResponse] = await Promise.all([
        getFabricDcs('', 1, 1000),
        import('../../api/fabricReturn').then(m => m.getFabricReturns('', 1, 1000))
      ]);
      
      const allDcs = dcResponse.data || [];
      const allReturns = returnResponse.data || [];
      
      // Calculate used weight from existing DCs and Returns (excluding current edit)
      const existingDcs = allDcs.filter(dc => dc.inwardNo === inwardNo && dc.id !== editingId);
      const existingReturns = allReturns.filter(ret => ret.inwardNo === inwardNo);
      
      const usedInDc = existingDcs.reduce((sum, dc) => sum + (Number(dc.totalQty) || 0), 0);
      const usedInReturn = existingReturns.reduce((sum, ret) => sum + (Number(ret.totalQty) || 0), 0);
      
      setBalance(totalInwardQty - usedInDc - usedInReturn);
      
      form.setFieldsValue({
        grnDate: selectedInward.grnDate ? dayjs(selectedInward.grnDate) : null,
        pdcNo: selectedInward.pdcNo,
        dyeParty: selectedInward.dyeingPartyId,
        dyeingPartyName: dyeParty?.partyName || '',
        dyeingDcNo: selectedInward.dyeingDcNo,
        dyeingDcDate: selectedInward.dyeingDcDate ? dayjs(selectedInward.dyeingDcDate) : null,
        orderNo: selectedInward.orderNo,
        poNo: selectedInward.poNo,
        dcType: selectedInward.dcType,
        fabricType: selectedInward.fabricType
      });
      
      setDcType(selectedInward.dcType || 'Fresh');
      
      // Auto-load details from inward with remaining weights
      if (selectedInward.details && selectedInward.details.length > 0) {
        setInwardDetails(selectedInward.details);
        
        // Calculate remaining weight, rolls, and processes for each detail
        const loadedDetails = selectedInward.details.map((d, idx) => {
          let usedWeightFromDcs = 0;
          let usedRollsFromDcs = 0;
          
          existingDcs.forEach(dc => {
            if (dc.details && dc.details.length > 0) {
              dc.details.forEach(detail => {
                if (detail.inwardDetailId === d.id) {
                  usedWeightFromDcs += Number(detail.processWeight) || 0;
                  usedRollsFromDcs += Number(detail.rolls) || 0;
                }
              });
            }
          });
          
          let usedWeightFromReturns = 0;
          let usedRollsFromReturns = 0;
          existingReturns.forEach(ret => {
            if (ret.details && ret.details.length > 0) {
              ret.details.forEach(detail => {
                if (detail.fabricId === d.fabricId && detail.colorId === d.colorId && detail.diaId === d.diaId && String(detail.gsm) === String(d.gsm)) {
                  usedWeightFromReturns += Number(detail.weight) || 0;
                  usedRollsFromReturns += Number(detail.rolls) || 0;
                }
              });
            }
          });
          
          const totalUsed = usedWeightFromDcs + usedWeightFromReturns;
          const totalRollsUsed = usedRollsFromDcs + usedRollsFromReturns;
          const remainingWeight = (d.weight || 0) - totalUsed;
          const remainingRolls = (d.rolls || 0) - totalRollsUsed;
          const processWt = remainingWeight > 0 ? remainingWeight : 0;
          const dcWt = remainingWeight > 0 ? remainingWeight : 0;
          const rolls = remainingRolls > 0 ? remainingRolls : 0;
          const allProcesses = d.processes ? JSON.parse(d.processes) : [];
          
          const weightLoss = processWt - dcWt;
          const lossPercentage = processWt > 0 ? ((processWt - dcWt) / processWt * 100) : 0;
          
          return {
            key: Date.now() + idx,
            inwardDetailId: d.id,
            fabricId: d.fabricId,
            colorId: d.colorId,
            diaId: d.diaId,
            inwFabricId: d.fabricId,
            inwColorId: d.colorId,
            inwDiaId: d.diaId,
            gsm: d.gsm,
            designNo: d.designNo || '',
            designName: d.designName || '',
            noOfColor: d.noOfColor || 0,
            inwardWeight: processWt,
            processWeight: processWt,
            dcWeight: dcWt,
            weightLoss: weightLoss,
            lossPercentage: lossPercentage,
            rolls: rolls,
            uomId: d.uomId,
            rate: 0,
            amount: 0,
            processes: allProcesses,
            remarks: d.remarks || ''
          };
        });
        setDetails(loadedDetails.filter(d => d.processWeight > 0 || d.rolls > 0));
      }
      
      if (selectedInward.processes) {
        setSelectedProcesses(selectedInward.processes.map((p, idx) => ({
          key: Date.now() + idx,
          processName: p.processName,
          remarks: ''
        })));
      }
    }
  };

  const handleAddDetail = () => {
    setDetails([...details, { 
      key: Date.now(),
      fabricId: null,
      colorId: null,
      diaId: null,
      inwFabricId: null,
      inwColorId: null,
      inwDiaId: null,
      inwardDetailId: null,
      gsm: '',
      designNo: '',
      designName: '',
      noOfColor: 0,
      inwardWeight: 0,
      processWeight: 0,
      dcWeight: 0,
      weightLoss: 0,
      lossPercentage: 0,
      rolls: 0,
      uomId: null,
      rate: 0,
      amount: 0,
      processes: [],
      remarks: ''
    }]);
  };

  const handleDeleteDetail = (key) => {
    setDetails(details.filter(d => d.key !== key));
  };

  const handleInwardDetailSelect = async (key, inwardDetailId) => {
    const selectedDetail = inwardDetails.find(d => d.id === inwardDetailId);
    if (selectedDetail) {
      const [dcResponse, returnResponse] = await Promise.all([
        getFabricDcs('', 1, 1000),
        import('../../api/fabricReturn').then(m => m.getFabricReturns('', 1, 1000))
      ]);
      
      const allDcs = dcResponse.data || [];
      const allReturns = returnResponse.data || [];
      const currentInwardNo = form.getFieldValue('grnNo');
      
      const existingDcs = allDcs.filter(dc => dc.inwardNo === currentInwardNo && dc.id !== editingId);
      const existingReturns = allReturns.filter(ret => ret.inwardNo === currentInwardNo);
      
      let usedWeightFromDcs = 0;
      let usedRollsFromDcs = 0;
      existingDcs.forEach(dc => {
        if (dc.details && dc.details.length > 0) {
          dc.details.forEach(detail => {
            if (detail.inwardDetailId === selectedDetail.id) {
              usedWeightFromDcs += Number(detail.processWeight) || 0;
              usedRollsFromDcs += Number(detail.rolls) || 0;
            }
          });
        }
      });
      
      let usedWeightFromReturns = 0;
      let usedRollsFromReturns = 0;
      existingReturns.forEach(ret => {
        if (ret.details && ret.details.length > 0) {
          ret.details.forEach(detail => {
            if (detail.fabricId === selectedDetail.fabricId && detail.colorId === selectedDetail.colorId && detail.diaId === selectedDetail.diaId && String(detail.gsm) === String(selectedDetail.gsm)) {
              usedWeightFromReturns += Number(detail.weight) || 0;
              usedRollsFromReturns += Number(detail.rolls) || 0;
            }
          });
        }
      });
      
      setDetails(currentDetails => {
        const usedWeightInForm = currentDetails
          .filter(d => d.key !== key && d.inwardDetailId === selectedDetail.id)
          .reduce((sum, d) => sum + (Number(d.processWeight) || 0), 0);
        
        const usedRollsInForm = currentDetails
          .filter(d => d.key !== key && d.inwardDetailId === selectedDetail.id)
          .reduce((sum, d) => sum + (Number(d.rolls) || 0), 0);
        
        const totalUsed = usedWeightFromDcs + usedWeightFromReturns + usedWeightInForm;
        const totalRollsUsed = usedRollsFromDcs + usedRollsFromReturns + usedRollsInForm;
        const remainingWeight = (selectedDetail.weight || 0) - totalUsed;
        const remainingRolls = (selectedDetail.rolls || 0) - totalRollsUsed;
        const processWt = remainingWeight > 0 ? remainingWeight : 0;
        const dcWt = remainingWeight > 0 ? remainingWeight : 0;
        const rolls = remainingRolls > 0 ? remainingRolls : 0;
        const allProcesses = selectedDetail.processes ? JSON.parse(selectedDetail.processes) : [];
        const weightLoss = processWt - dcWt;
        const lossPercentage = processWt > 0 ? ((processWt - dcWt) / processWt * 100) : 0;
        
        return currentDetails.map(d => {
          if (d.key === key) {
            return {
              ...d,
              inwardDetailId: selectedDetail.id,
              inwFabricId: selectedDetail.fabricId,
              inwColorId: selectedDetail.colorId,
              inwDiaId: selectedDetail.diaId,
              fabricId: selectedDetail.fabricId,
              colorId: selectedDetail.colorId,
              diaId: selectedDetail.diaId,
              gsm: selectedDetail.gsm,
              designNo: selectedDetail.designNo || '',
              designName: selectedDetail.designName || '',
              noOfColor: selectedDetail.noOfColor || 0,
              rolls: rolls,
              uomId: selectedDetail.uomId,
              inwardWeight: processWt,
              processWeight: processWt,
              dcWeight: dcWt,
              weightLoss: weightLoss,
              lossPercentage: lossPercentage,
              processes: allProcesses,
              amount: 0
            };
          }
          return d;
        });
      });
    }
  };

  const handleDetailChange = (key, field, value) => {
    console.log('handleDetailChange called:', { key, field, value });
    setDetails(details.map(d => {
      if (d.key === key) {
        console.log('Current detail:', d);
        const updated = { ...d, [field]: value };
        
        // Calculate weight loss and percentage
        if (field === 'processWeight' || field === 'dcWeight') {
          // Auto-copy process weight to dc weight when process weight changes
          if (field === 'processWeight') {
            updated.dcWeight = value;
            updated.inwardWeight = value;
          }
          
          const processWeight = field === 'processWeight' ? value : d.processWeight;
          const dcWeight = field === 'dcWeight' ? value : (field === 'processWeight' ? value : d.dcWeight);
          
          console.log('Calculating:', { processWeight, dcWeight });
          
          // Calculate weight loss: Process Weight - DC Weight
          updated.weightLoss = processWeight - dcWeight;
          updated.lossPercentage = processWeight > 0 ? ((processWeight - dcWeight) / processWeight * 100) : 0;
          
          console.log('Result:', { weightLoss: updated.weightLoss, lossPercentage: updated.lossPercentage });
        }
        
        // Calculate amount
        if (field === 'dcWeight' || field === 'rate' || field === 'processWeight') {
          const dcWeight = field === 'dcWeight' ? value : (field === 'processWeight' ? value : d.dcWeight);
          const rate = field === 'rate' ? value : d.rate;
          updated.amount = dcWeight * rate;
        }
        
        return updated;
      }
      return d;
    }));
  };

  const handleDeleteProcess = (key) => {
    setSelectedProcesses(selectedProcesses.filter(p => p.key !== key));
  };

  const detailColumns = [
    { title: 'Sl.No', width: 50, render: (_, record, index) => index + 1 },
    {
      title: 'Inward (Dia/Fabric/Color/Gsm)',
      width: 200,
      render: (_, record) => {
        if (isViewMode && record.inwardDetailId) {
          const selectedDetail = inwardDetails.find(d => d.id === record.inwardDetailId);
          if (selectedDetail) {
            const dia = dias.find(dia => dia.id === selectedDetail.diaId)?.masterName || '';
            const fabric = fabrics.find(f => f.id === selectedDetail.fabricId)?.masterName || '';
            const color = colors.find(c => c.id === selectedDetail.colorId)?.masterName || '';
            const gsm = selectedDetail.gsm || '';
            const designInfo = selectedDetail.designNo ? ` | ${selectedDetail.designNo}` : '';
            const designName = selectedDetail.designName ? ` | ${selectedDetail.designName}` : '';
            const colorCount = selectedDetail.noOfColor ? ` | ${selectedDetail.noOfColor}` : '';
            return `${dia}/${fabric}/${color}${gsm ? `/${gsm}` : ''}${designInfo}${designName}${colorCount}`;
          }
          return '-';
        }
        return (
          <Select 
            disabled={isViewMode}
            value={record.inwardDetailId || undefined}
            onChange={(val) => {
              handleInwardDetailSelect(record.key, val);
            }}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
          >
            {inwardDetails.map(d => {
              const dia = dias.find(dia => dia.id === d.diaId)?.masterName || '';
              const fabric = fabrics.find(f => f.id === d.fabricId)?.masterName || '';
              const color = colors.find(c => c.id === d.colorId)?.masterName || '';
              const gsm = d.gsm || '';
              const designInfo = d.designNo ? ` | ${d.designNo}` : '';
              const designName = d.designName ? ` | ${d.designName}` : '';
              const colorCount = d.noOfColor ? ` | ${d.noOfColor}` : '';
              return (
                <Option key={d.id} value={d.id}>
                  {`${dia}/${fabric}/${color}${gsm ? `/${gsm}` : ''}${designInfo}${designName}${colorCount}`}
                </Option>
              );
            })}
          </Select>
        );
      }
    },
    {
      title: 'Dc Dia',
      dataIndex: 'diaId',
      width: 80,
      render: (val, record) => (
        <Select disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'diaId', v)} style={{ width: '100%' }}>
          {dias.map(d => <Option key={d.id} value={d.id}>{d.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Dc Fabric',
      dataIndex: 'fabricId',
      width: 120,
      render: (val, record) => (
        <Select disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'fabricId', v)} style={{ width: '100%' }} showSearch>
          {fabrics.map(f => <Option key={f.id} value={f.id}>{f.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'DC Color',
      dataIndex: 'colorId',
      width: 120,
      render: (val, record) => (
        <Select disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'colorId', v)} style={{ width: '100%' }} showSearch>
          {colors.map(c => <Option key={c.id} value={c.id}>{c.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'GSM',
      dataIndex: 'gsm',
      width: 80,
      render: (val) => (
        <Input disabled value={val} style={{ width: '100%' }} autoComplete="off" />
      )
    },
    ...(fabricType === 'Print Lot' ? [
      {
        title: 'Design No',
        dataIndex: 'designNo',
        width: 100,
        render: (val, record) => (
          <Input disabled value={val} autoComplete="off" />
        )
      },
      {
        title: 'Design Name',
        dataIndex: 'designName',
        width: 120,
        render: (val, record) => (
          <Input disabled value={val} autoComplete="off" />
        )
      },
      {
        title: 'No of Color',
        dataIndex: 'noOfColor',
        width: 80,
        render: (val, record) => (
          <InputNumber disabled value={val} style={{ width: '100%' }} autoComplete="off" />
        )
      }
    ] : []),
    {
      title: 'Process Weight',
      dataIndex: 'processWeight',
      width: 100,
      render: (val, record) => (
        <InputNumber disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'processWeight', v)} style={{ width: '100%' }} precision={3} autoComplete="off" />
      )
    },
    {
      title: 'DC Weight',
      dataIndex: 'dcWeight',
      width: 100,
      render: (val, record) => (
        <InputNumber disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'dcWeight', v)} style={{ width: '100%' }} precision={3} autoComplete="off" />
      )
    },
    {
      title: 'Weight Loss',
      dataIndex: 'weightLoss',
      width: 100,
      render: (val) => <InputNumber value={val} disabled style={{ width: '100%' }} precision={3} autoComplete="off" />
    },
    {
      title: 'Loss %',
      dataIndex: 'lossPercentage',
      width: 80,
      render: (val) => <InputNumber value={val} disabled style={{ width: '100%' }} precision={2} autoComplete="off" />
    },
    {
      title: 'Rolls',
      dataIndex: 'rolls',
      width: 80,
      render: (val, record) => (
        <InputNumber disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'rolls', v)} style={{ width: '100%' }} autoComplete="off" />
      )
    },
    {
      title: 'Uom',
      dataIndex: 'uomId',
      width: 80,
      render: (val, record) => (
        <Select disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'uomId', v)} style={{ width: '100%' }}>
          {uoms.map(u => <Option key={u.id} value={u.id}>{u.masterName}</Option>)}
        </Select>
      )
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      width: 80,
      render: (val, record) => (
        <InputNumber disabled={isViewMode} value={val} onChange={(v) => handleDetailChange(record.key, 'rate', v)} style={{ width: '100%' }} precision={2} autoComplete="off" />
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 100,
      render: (val) => <InputNumber value={val} disabled style={{ width: '100%' }} precision={2} autoComplete="off" />
    },
    ...(enableItemWiseProcess ? [{
      title: 'Process',
      dataIndex: 'processes',
      width: 200,
      render: (val, record) => {
        const selectedInwardDetail = inwardDetails.find(d => d.id === record.inwardDetailId);
        const allProcesses = selectedInwardDetail?.processes ? JSON.parse(selectedInwardDetail.processes) : [];
        
        return (
          <Select
            mode="multiple"
            disabled={isViewMode}
            value={val || []}
            onChange={(v) => handleDetailChange(record.key, 'processes', v)}
            style={{ width: '100%' }}
            placeholder="Select processes"
          >
            {allProcesses.map((p, idx) => <Option key={idx} value={p}>{p}</Option>)}
          </Select>
        );
      }
    }] : []),
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      width: 120,
      render: (val, record) => (
        <Input disabled={isViewMode} value={val} onChange={(e) => handleDetailChange(record.key, 'remarks', e.target.value)} autoComplete="off" />
      )
    },
    ...(!isViewMode ? [{
      title: 'Action',
      width: 60,
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDetail(record.key)} />
      )
    }] : [])
  ];

  const processColumns = [
    { title: 'Sl.No', width: 80, render: (_, record, index) => index + 1 },
    { title: 'Process', dataIndex: 'processName', width: 200 },
    { title: 'Remarks', dataIndex: 'remarks', width: 200 }
  ];

  const listColumns = [
    { title: 'S.No', key: 'sno', width: 50, render: (_, record, index) => index + 1 },
    { title: 'DC No', dataIndex: 'dcNo', width: 100 },
    { title: 'DC Date', dataIndex: 'dcDate', width: 100, render: (val) => dayjs(val).format('DD-MM-YYYY') },
    { title: 'Party', dataIndex: 'partyId', width: 150, render: (val) => parties.find(p => p.id === val)?.partyName || '' },
    { title: 'Inward No', dataIndex: 'inwardNo', width: 100 },
    { title: 'Total Qty', dataIndex: 'totalQty', width: 100 },
    { title: 'Total Rolls', dataIndex: 'totalRolls', width: 100 },
    {
      title: 'Actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} style={{ color: '#1890ff' }} />
          {canEdit('fabric_dc') && (
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)} 
              style={{ color: record.isLocked ? '#d9d9d9' : '#52c41a' }}
              disabled={record.isLocked}
              title={record.isLocked ? 'Cannot edit - used in Bill' : 'Edit'}
            />
          )}
          {canDelete('fabric_dc') && (
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)} 
              style={{ color: record.isLocked ? '#d9d9d9' : '#ff4d4f' }}
              disabled={record.isLocked}
              title={record.isLocked ? 'Cannot delete - used in Bill' : 'Delete'}
            />
          )}
          <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => handlePrintRecord(record)} style={{ color: '#722ed1' }} />
        </Space>
      )
    }
  ];

  const totalQty = details.reduce((sum, d) => sum + (Number(d.dcWeight) || 0), 0);
  const totalProcessWeight = details.reduce((sum, d) => sum + (Number(d.processWeight) || 0), 0);
  const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);

  useEffect(() => {
    const updateRemaining = async () => {
      if (inwardQty > 0 && form.getFieldValue('grnNo')) {
        const [dcResponse, returnResponse] = await Promise.all([
          getFabricDcs('', 1, 1000),
          import('../../api/fabricReturn').then(m => m.getFabricReturns('', 1, 1000))
        ]);
        
        const allDcs = dcResponse.data || [];
        const allReturns = returnResponse.data || [];
        const currentInwardNo = form.getFieldValue('grnNo');
        
        const existingDcs = allDcs.filter(dc => dc.inwardNo === currentInwardNo && dc.id !== editingId);
        const existingReturns = allReturns.filter(ret => ret.inwardNo === currentInwardNo);
        
        let usedProcessWeight = 0;
        existingDcs.forEach(dc => {
          if (dc.details && dc.details.length > 0) {
            usedProcessWeight += dc.details.reduce((sum, detail) => 
              sum + (Number(detail.processWeight) || 0), 0
            );
          }
        });
        
        const usedInReturn = existingReturns.reduce((sum, ret) => sum + (Number(ret.totalQty) || 0), 0);
        
        setPendingInward(inwardQty - usedProcessWeight - usedInReturn);
        
        const remaining = inwardQty - usedProcessWeight - usedInReturn - totalProcessWeight;
        setBalance(remaining);
      }
    };
    
    updateRemaining();
  }, [totalProcessWeight, inwardQty, editingId, form]);

  const filteredFabricDcs = fabricDcs.filter(item => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      item.dcNo?.toLowerCase().includes(search) ||
      dayjs(item.dcDate).format('DD-MM-YYYY').includes(search) ||
      item.inwardNo?.toLowerCase().includes(search)
    );
  });

  return (
    <Card>
      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 4px 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          height: auto !important;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 2px 4px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
        }
        .compact-table .ant-table-tbody > tr {
          height: auto !important;
        }
        .compact-table .ant-input,
        .compact-table .ant-input-number,
        .compact-table .ant-select-selector {
          font-size: 11px !important;
          min-height: 24px !important;
          height: 24px !important;
        }
        .compact-table .ant-input-number-input {
          height: 22px !important;
        }
        @media (max-width: 768px) {
          .page-header { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .page-header .ant-space { width: 100% !important; }
          .section-header { flex-direction: column !important; gap: 8px !important; align-items: flex-start !important; }
          .info-container { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; }
          .info-item { min-width: 120px !important; }
        }
      `}</style>
      <div className="page-header" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>Fabric DC</Title>
        {!isFormVisible && (
          <Space>
            <Input 
              placeholder="Search" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, height: 32 }}
              size="small"
              allowClear
              autoComplete="off"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNew} disabled={!canAdd('fabric_dc')}>New</Button>
          </Space>
        )}
      </div>

      {!isFormVisible ? (
        <Table columns={listColumns} dataSource={filteredFabricDcs} rowKey="id" size="small" className="compact-table" />
      ) : (
        <Form form={form} layout="vertical" size="small">
          <Row gutter={8}>
            <Col span={3}>
              <Form.Item label="Dc No" name="dcNo" rules={[{ required: true }]} style={{ marginBottom: 6 }}>
                <Input disabled={editingId ? true : (!isAdmin || isViewMode)} style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="Date" name="dcDate" rules={[{ required: true }]} style={{ marginBottom: 6 }}>
                <DatePicker disabled={isViewMode} style={{ width: '100%', height: '32px' }} format="DD-MM-YYYY" size="middle" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Party" name="partyId" style={{ marginBottom: 6 }}>
                <Select disabled={isViewMode} showSearch onChange={loadInwards} filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} style={{ height: '32px' }} size="middle">
                  {parties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item label="Inward No" name="grnNo" style={{ marginBottom: 6 }}>
                <Select disabled={isViewMode} style={{ height: '32px' }} size="middle" onChange={handleInwardSelect} showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                  {inwards.map(i => (
                    <Option key={i.id} value={i.grnNo}>
                      {`${i.grnNo} | ${dayjs(i.grnDate).format('DD-MM-YY')} | ${i.pdcNo || 'N/A'} | ${Number(i.totalQty || 0).toFixed(2)}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="GRN Date" name="grnDate" style={{ marginBottom: 6 }}>
                <DatePicker disabled style={{ width: '100%', height: '32px' }} format="DD-MM-YYYY" size="middle" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={6}>
              <Form.Item label="Delivery To" name="deliveryTo" style={{ marginBottom: 6 }}>
                <Select disabled={isViewMode} showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())} style={{ height: '32px' }} size="middle">
                  {allParties.map(p => <Option key={p.id} value={p.id}>{p.partyName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={18}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: 2 }}>Info</label>
                <div className="info-container" style={{ display: 'inline-flex', padding: '6px 8px', backgroundColor: '#f5f5f5', borderRadius: '4px', minHeight: '32px', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>PDC No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('pdcNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px', display: 'none' }} className="info-divider"></div>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Dye Party</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('dyeingPartyName') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px', display: 'none' }} className="info-divider"></div>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Dye Dc No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('dyeingDcNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px', display: 'none' }} className="info-divider"></div>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Dye Dc Date</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('dyeingDcDate') ? form.getFieldValue('dyeingDcDate').format('DD-MM-YYYY') : '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px', display: 'none' }} className="info-divider"></div>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Order No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('orderNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px', display: 'none' }} className="info-divider"></div>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>PO No</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('poNo') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px', display: 'none' }} className="info-divider"></div>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Fabric Type</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{form.getFieldValue('fabricType') || '-'}</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#d9d9d9', margin: '0 4px', display: 'none' }} className="info-divider"></div>
                  <div className="info-item" style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>DC Type</div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{dcType || '-'}</div>
                  </div>
                </div>
              </div>
              <Form.Item name="pdcNo" hidden><Input /></Form.Item>
              <Form.Item name="dyeingPartyName" hidden><Input /></Form.Item>
              <Form.Item name="dyeParty" hidden><Input /></Form.Item>
              <Form.Item name="dyeingDcNo" hidden><Input /></Form.Item>
              <Form.Item name="dyeingDcDate" hidden><DatePicker /></Form.Item>
              <Form.Item name="orderNo" hidden><Input /></Form.Item>
              <Form.Item name="poNo" hidden><Input /></Form.Item>
              <Form.Item name="fabricType" hidden><Input /></Form.Item>
              <Form.Item name="dcType" hidden><Input /></Form.Item>
            </Col>
            <Col span={3}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '12px' }}>Inward Qty</label>
                <InputNumber value={inwardQty} disabled style={{ width: '100%', height: '32px', backgroundColor: '#ffc0cb' }} precision={3} autoComplete="off" />
              </div>
            </Col>
            <Col span={3}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '12px' }}>Pending Inward</label>
                <InputNumber value={pendingInward} disabled style={{ width: '100%', height: '32px', backgroundColor: '#add8e6' }} precision={3} autoComplete="off" />
              </div>
            </Col>
            <Col span={3}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '12px' }}>Balance</label>
                <InputNumber value={balance} disabled style={{ width: '100%', height: '32px', backgroundColor: '#90ee90' }} precision={3} autoComplete="off" />
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: 4 }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Details</Title>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddDetail} disabled={isViewMode} style={{ backgroundColor: '#031d38', color: '#fff', borderColor: '#031d38' }}>Add Row</Button>
            </div>
            <Table 
              columns={detailColumns} 
              dataSource={details} 
              pagination={false} 
              scroll={{ x: 1800, y: 200 }}
              size="small"
              bordered
              className="compact-table"
            />
          </div>

          {!enableItemWiseProcess && (
          <div style={{ marginTop: 4 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 4, fontSize: '14px' }}>Process</Title>
            <Table 
              columns={processColumns} 
              dataSource={selectedProcesses} 
              pagination={false}
              size="small"
              className="compact-table"
            />
          </div>
          )}

          <Row gutter={8} style={{ marginTop: 4 }}>
            <Col span={6}>
              <Form.Item label="Remarks" name="remarks" style={{ marginBottom: 6 }}>
                <TextArea disabled={isViewMode} rows={1} autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Rec Name" name="receivedName" style={{ marginBottom: 6 }}>
                <Input disabled={isViewMode} style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="HSN Code" name="hsnCode" style={{ marginBottom: 6 }}>
                <Input disabled={isViewMode} style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Vehicle No" name="vehicleNo" style={{ marginBottom: 6 }}>
                <Input disabled={isViewMode} style={{ height: '32px' }} size="middle" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '12px' }}>Total Rolls</label>
                <Input value={totalRolls} disabled style={{ height: '32px' }} />
              </div>
            </Col>
            <Col span={3}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '12px' }}>Total Qty</label>
                <Input value={totalQty.toFixed(3)} disabled style={{ height: '32px' }} />
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: 4, textAlign: 'right' }}>
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => { setIsFormVisible(false); setIsViewMode(false); }}>Cancel</Button>
              {!isViewMode && (
                <>
                  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSubmit(false)}>Save</Button>
                  <Button type="primary" icon={<PrinterOutlined />} loading={loading} onClick={() => handleSubmit(true)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Save & Print</Button>
                </>
              )}
              {isViewMode && <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>}
            </Space>
          </div>
        </Form>
      )}

      <div style={{ display: 'none' }}>
        {printData && (
          <FabricDCPrint 
            ref={printRef}
            data={printData}
          />
        )}
      </div>
    </Card>
  );
};

export default FabricDc;
