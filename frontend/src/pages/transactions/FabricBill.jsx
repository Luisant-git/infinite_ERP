import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Select,
  DatePicker,
  Table,
  Modal,
  InputNumber,
  message,
  Space,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  UnorderedListOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getNextBillNo,
  getFabricBills,
  createFabricBill,
  updateFabricBill,
  deleteFabricBill,
  getAvailableDcs,
} from "../../api/fabricBill";
import { getParties } from "../../api/party";
import { getGstMasters } from "../../api/gstMaster";
import { getMastersByType } from "../../api/fabricInward";
import { getPartyProcessRates } from "../../api/partyProcessRate";
import { getProcesses } from "../../api/process";
import { getSettings } from "../../api/settings";
import { useMenuPermissions } from "../../hooks/useMenuPermissions";

const { Title } = Typography;
const { Option } = Select;

const FabricBill = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fabricBills, setFabricBills] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false); // new state for view-only mode
  const {
    adminUser: isAdmin,
    canAdd,
    canEdit,
    canDelete,
  } = useMenuPermissions();

  const [parties, setParties] = useState([]);
  const [gstMasters, setGstMasters] = useState([]);
  const [masters, setMasters] = useState([]);
  const [details, setDetails] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dcModalVisible, setDcModalVisible] = useState(false);
  const [availableDcs, setAvailableDcs] = useState([]);
  const [selectedDcs, setSelectedDcs] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [dcSearchText, setDcSearchText] = useState("");
  const [partyProcessRates, setPartyProcessRates] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [concernData, setConcernData] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadData();
    loadMasters();
    loadProcesses();
    loadConcernData();
    loadSettings();
  }, []);

  // Auto-calculate totals whenever details change
  useEffect(() => {
    if (details.length > 0) {
      setTimeout(() => {
        calculateTotals();
      }, 100);
    }
  }, [details]);

  // Auto-calculate totals whenever taxes change
  useEffect(() => {
    setTimeout(() => {
      calculateTotals();
    }, 100);
  }, [taxes]);

  const loadData = async () => {
    try {
      const response = await getFabricBills("", 1, 100);
      setFabricBills(response.data || []);
    } catch (error) {
      console.error("Error loading fabric bills:", error);
    }
  };

  const loadMasters = async () => {
    try {
      const [partiesRes, gstRes, fabricRes, colorRes, diaRes, uomRes] =
        await Promise.all([
          getParties("", 1, 1000),
          getGstMasters("", 1, 100),
          getMastersByType("Fabric", true),
          getMastersByType("Color", true),
          getMastersByType("Dia", true),
          getMastersByType("UOM", true),
        ]);

      const allParties = partiesRes.data || [];
      setParties(
        allParties.filter((p) =>
          p.partyTypes?.some(
            (pt) => pt.partyType.partyTypeName.toLowerCase() === "customer",
          ),
        ),
      );
      setGstMasters(gstRes.data?.filter((g) => g.isActive === 1) || []);
      setMasters([...fabricRes, ...colorRes, ...diaRes, ...uomRes]);
    } catch (error) {
      console.error("Error loading masters:", error);
    }
  };

  const loadConcernData = async () => {
    try {
      const concernId = localStorage.getItem("selectedCompanyId");
      if (concernId) {
        const { getConcerns } = await import("../../api/concern");
        const response = await getConcerns("", 1, 1000);
        const concern = response.data?.find(
          (c) => c.id === parseInt(concernId),
        );
        setConcernData(concern || null);
      }
    } catch (error) {
      console.error("Error loading concern data:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadProcesses = async () => {
    try {
      const response = await getProcesses("", 1, 1000);
      setProcesses(response.data || []);
    } catch (error) {
      console.error("Error loading processes:", error);
    }
  };

  const calculateProcessRate = (selectedProcesses) => {
    if (
      !selectedProcesses ||
      !Array.isArray(selectedProcesses) ||
      selectedProcesses.length === 0
    ) {
      return 0;
    }

    let totalRate = 0;
    selectedProcesses.forEach((processName) => {
      // Find the process by name to get its ID
      const process = processes.find((p) => p.processName === processName);
      if (process) {
        // Find the rate for this process
        const processRate = partyProcessRates.find(
          (rate) => rate.processId === process.id,
        );
        if (processRate) {
          totalRate += Number(processRate.ratePerKg) || 0;
        }
      }
    });

    return totalRate;
  };

  const handlePartyChange = async (partyId) => {
    setSelectedParty(partyId);

    // Load credit days from selected party
    const party = parties.find((p) => p.id === partyId);
    if (party) {
      form.setFieldsValue({
        creditDays: party.creditDays || 0,
        invoiceTo: partyId, // Auto-set Invoice To same as Party
      });
    }

    // Load party process rates
    if (partyId) {
      try {
        const rates = await getPartyProcessRates(partyId);
        setPartyProcessRates(Array.isArray(rates) ? rates : []);
      } catch (error) {
        console.error("Error loading party process rates:", error);
        setPartyProcessRates([]);
      }
    } else {
      setPartyProcessRates([]);
    }

    // Clear existing taxes when party changes
    setTaxes([]);
    
    // Auto-load taxes when party is selected
    if (partyId && concernData) {
      setTimeout(() => {
        autoLoadTaxes(partyId);
      }, 200);
    }
    
    setTimeout(calculateTotals, 100);
  };

  const handleLoadDcs = async () => {
    if (!selectedParty) {
      message.warning("Please select a party first");
      return;
    }

    try {
      const dcs = await getAvailableDcs(selectedParty);
      setAvailableDcs(dcs);
      setSelectedDcs([]);
      setDcSearchText(""); // Reset search when opening modal
      setDcModalVisible(true);
    } catch (error) {
      message.error("Failed to load DCs");
      console.error("Error loading DCs:", error);
    }
  };

  const handleDcSelection = (dcId, checked) => {
    if (checked) {
      setSelectedDcs([...selectedDcs, dcId]);
    } else {
      setSelectedDcs(selectedDcs.filter((id) => id !== dcId));
    }
  };

  const handleAddSelectedDcs = () => {
    const selectedDcRecords = availableDcs.filter((dc) =>
      selectedDcs.includes(dc.id),
    );

    const newDetails = selectedDcRecords.flatMap((dc) =>
      dc.details.map((detail) => {
        // Get master names for display
        const fabric = masters.find(
          (m) => m.id === detail.fabricId && m.masterType === "Fabric",
        );
        const color = masters.find(
          (m) => m.id === detail.colorId && m.masterType === "Color",
        );
        const dia = masters.find(
          (m) => m.id === detail.diaId && m.masterType === "Dia",
        );

        // Parse and format processes
        let processArray = [];
        let processText = "";
        let processListText = "";
        if (detail.processes) {
          try {
            const processes =
              typeof detail.processes === "string"
                ? JSON.parse(detail.processes)
                : detail.processes;
            if (Array.isArray(processes)) {
              processArray = processes;
              processText = processes.join(", ");
              processListText = processes.join(" / ");
            } else {
              processArray = [detail.processes];
              processText = detail.processes;
              processListText = detail.processes;
            }
          } catch (e) {
            processArray = [detail.processes];
            processText = detail.processes;
            processListText = detail.processes;
          }
        }

        return {
          key: Date.now() + Math.random(),
          inwardNo: dc.inwardNo,
          grnId: null,
          pdcNo: dc.pdcNo,
          dcNo: dc.dcNo,
          dcId: dc.id,
          dcDate: dc.dcDate,
          fabricId: detail.fabricId,
          colorId: detail.colorId,
          diaId: detail.diaId,
          gsm: detail.gsm,
          designNo: detail.designNo,
          designName: detail.designName,
          noOfColor: detail.noOfColor,
          weight: detail.dcWeight || 0,
          rolls: detail.rolls || 0,
          uomId: detail.uomId,
          rate: calculateProcessRate(processArray),
          amount: (detail.dcWeight || 0) * calculateProcessRate(processArray),
          processes: processArray,
          originalProcesses: processArray,
          process: processText,
          processList: processListText,
          remarks: "", // Don't fetch remarks from DC
        };
      }),
    );

    setDetails([...details, ...newDetails]);
    setDcModalVisible(false);
    setSelectedDcs([]);

    // Recalculate totals immediately after adding DCs
    setTimeout(() => {
      calculateTotals();
    }, 100);

    message.success(
      `Added ${selectedDcRecords.length} DC(s) with ${newDetails.length} items`,
    );
  };

  const handleNew = async () => {
    try {
      const response = await getNextBillNo();
      form.resetFields();
      form.setFieldsValue({
        billNo: response.billNo,
        billDate: dayjs(),
        creditDays: 0,
        hsnCode: settings?.defaultHsnCode || "",
      });
      setDetails([]);
      setTaxes([]);
      setEditingId(null);
      setSelectedParty(null);
      setIsViewMode(false); // ensure view mode is cleared
      setIsFormVisible(true);
    } catch (error) {
      message.error("Failed to generate bill number");
    }
  };

  const handleEdit = (record) => {
    if (!canEdit("fabric_bill")) {
      message.warning("You do not have permission to edit");
      return;
    }
    setEditingId(record.id);
    setIsViewMode(false); // clear view mode when editing
    form.setFieldsValue({
      ...record,
      billDate: dayjs(record.billDate),
      // Parse numeric fields properly
      totalQty: Number(record.totalQty) || 0,
      totalRolls: Number(record.totalRolls) || 0,
      totalAmount: Number(record.totalAmount) || 0,
      noOfDesign: Number(record.noOfDesign) || 0,
      designRate: Number(record.designRate) || 0,
      designAmount: Number(record.designAmount) || 0,
      noOfScreen: Number(record.noOfScreen) || 0,
      screenRate: Number(record.screenRate) || 0,
      screenAmount: Number(record.screenAmount) || 0,
      gstAmount: Number(record.gstAmount) || 0,
      otherCharges: Number(record.otherCharges) || 0,
      roundOff: Number(record.roundOff) || 0,
      recAmount: Number(record.recAmount) || 0,
      diffAmount: Number(record.diffAmount) || 0,
      grantAmount: Number(record.grantAmount) || 0,
      netAmount: Number(record.netAmount) || 0,
      creditDays: Number(record.creditDays) || 0,
    });
    // parse process string into array for editing
    setDetails(
      record.details?.map((d) => {
        const parseProc = (str) => {
          if (!str) return [];
          return str
            .toString()
            .split(/[\/,]\s*/)
            .map((s) => s.trim())
            .filter((s) => s);
        };
        const procArray = parseProc(d.process);
        return {
          ...d,
          key: d.id,
          dcDate: d.dcDate ? dayjs(d.dcDate) : null,
          // Parse numeric fields in details
          weight: Number(d.weight) || 0,
          rolls: Number(d.rolls) || 0,
          rate: Number(d.rate) || 0,
          amount: Number(d.amount) || 0,
          noOfColor: Number(d.noOfColor) || 0,
          processes: procArray,
          originalProcesses: procArray,
        };
      }) || [],
    );

    // Fix: Properly load taxes with correct key structure
    const loadedTaxes =
      record.taxes?.map((t, idx) => ({
        ...t,
        key: t.id || Date.now() + idx,
        taxName: t.taxName,
        taxPercentage: Number(t.taxPercentage) || 0,
        taxAmount: Number(t.taxAmount) || 0,
      })) || [];

    console.log("Loading taxes for edit:", loadedTaxes);
    setTaxes(loadedTaxes);

    setSelectedParty(record.partyId);
    setIsFormVisible(true);

    // Recalculate totals after loading data
    setTimeout(calculateTotals, 200);
  };

  const handleView = (record) => {
    // load record into form but stay read-only
    setEditingId(record.id);
    setIsViewMode(true);

    form.setFieldsValue({
      ...record,
      billDate: dayjs(record.billDate),
      // parse numeric fields same as edit
      totalQty: Number(record.totalQty) || 0,
      totalRolls: Number(record.totalRolls) || 0,
      totalAmount: Number(record.totalAmount) || 0,
      noOfDesign: Number(record.noOfDesign) || 0,
      designRate: Number(record.designRate) || 0,
      designAmount: Number(record.designAmount) || 0,
      noOfScreen: Number(record.noOfScreen) || 0,
      screenRate: Number(record.screenRate) || 0,
      screenAmount: Number(record.screenAmount) || 0,
      gstAmount: Number(record.gstAmount) || 0,
      otherCharges: Number(record.otherCharges) || 0,
      roundOff: Number(record.roundOff) || 0,
      recAmount: Number(record.recAmount) || 0,
      diffAmount: Number(record.diffAmount) || 0,
      grantAmount: Number(record.grantAmount) || 0,
      netAmount: Number(record.netAmount) || 0,
      creditDays: Number(record.creditDays) || 0,
    });

    // parse process string into array for viewing
    setDetails(
      record.details?.map((d) => {
        const parseProc = (str) => {
          if (!str) return [];
          return str
            .toString()
            .split(/[\/,]\s*/)
            .map((s) => s.trim())
            .filter((s) => s);
        };
        const procArray = parseProc(d.process);
        return {
          ...d,
          key: d.id,
          dcDate: d.dcDate ? dayjs(d.dcDate) : null,
          weight: Number(d.weight) || 0,
          rolls: Number(d.rolls) || 0,
          rate: Number(d.rate) || 0,
          amount: Number(d.amount) || 0,
          noOfColor: Number(d.noOfColor) || 0,
          processes: procArray,
          // ensure originalProcesses available so select shows values in view mode
          originalProcesses: procArray,
        };
      }) || [],
    );

    const loadedTaxes =
      record.taxes?.map((t, idx) => ({
        ...t,
        key: t.id || Date.now() + idx,
        taxName: t.taxName,
        taxPercentage: Number(t.taxPercentage) || 0,
        taxAmount: Number(t.taxAmount) || 0,
      })) || [];

    setTaxes(loadedTaxes);
    setSelectedParty(record.partyId);
    setIsFormVisible(true);

    setTimeout(calculateTotals, 200);
  };

  const handleDelete = (id) => {
    if (!canDelete("fabric_bill")) {
      message.warning("You do not have permission to delete");
      return;
    }
    Modal.confirm({
      title: "Delete Fabric Bill",
      content: "Are you sure?",
      onOk: async () => {
        try {
          await deleteFabricBill(id);
          message.success("Deleted successfully");
          loadData();
        } catch (error) {
          message.error("Failed to delete");
        }
      },
    });
  };

  const calculateTotals = () => {
    const totalQty = details.reduce(
      (sum, d) => sum + (Number(d.weight) || 0),
      0,
    );
    const totalRolls = details.reduce((sum, d) => sum + (d.rolls || 0), 0);
    const totalAmount = details.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0,
    );
    
    // Recalculate tax amounts based on new total amount
    const updatedTaxes = taxes.map(tax => ({
      ...tax,
      taxAmount: (totalAmount * Number(tax.taxPercentage)) / 100
    }));
    
    const gstAmount = updatedTaxes.reduce(
      (sum, t) => sum + (Number(t.taxAmount) || 0),
      0,
    );
    
    // Update taxes state with recalculated amounts
    if (updatedTaxes.length > 0) {
      setTaxes(updatedTaxes);
    }

    const designAmount =
      (form.getFieldValue("noOfDesign") || 0) *
      (form.getFieldValue("designRate") || 0);
    const screenAmount =
      (form.getFieldValue("noOfScreen") || 0) *
      (form.getFieldValue("screenRate") || 0);
    const otherCharges = form.getFieldValue("otherCharges") || 0;
    const recAmount = form.getFieldValue("recAmount") || 0;
    const diffAmount = form.getFieldValue("diffAmount") || 0;
    const grantAmount = form.getFieldValue("grantAmount") || 0;

    const netBeforeRound =
      totalAmount +
      gstAmount +
      designAmount +
      screenAmount +
      otherCharges +
      recAmount +
      diffAmount +
      grantAmount;
    const roundOff = Math.round(netBeforeRound) - netBeforeRound;
    const netAmount = Math.round(netBeforeRound);

    form.setFieldsValue({
      totalQty,
      totalRolls,
      totalAmount,
      designAmount,
      screenAmount,
      gstAmount,
      roundOff: roundOff.toFixed(2),
      netAmount,
    });
  };

  const handleSubmit = async () => {
    if (isViewMode) return; // nothing to do when viewing
    try {
      const values = await form.validateFields();

      const trimmedBillNo = values.billNo?.trim();
      if (!trimmedBillNo) {
        message.error("Bill number is required!");
        return;
      }

      // Check for duplicate
      const billResponse = await getFabricBills("", 1, 1000);
      const allBills = billResponse.data || [];
      const duplicate = allBills.find(
        (f) => f.billNo?.trim() === trimmedBillNo && f.id !== editingId,
      );
      if (duplicate) {
        message.error("Bill number already exists!");
        return;
      }

      setLoading(true);

      const data = {
        ...values,
        billNo: trimmedBillNo,
        billDate: values.billDate?.toISOString(),
        details: details.map((d) => ({
          inwardNo: d.inwardNo,
          grnId: d.grnId,
          pdcNo: d.pdcNo,
          dcNo: d.dcNo,
          dcId: d.dcId,
          dcDate: d.dcDate,
          fabricId: d.fabricId,
          colorId: d.colorId,
          diaId: d.diaId,
          gsm: d.gsm,
          designNo: d.designNo,
          designName: d.designName,
          noOfColor: d.noOfColor,
          weight: Number(d.weight) || 0,
          rolls: d.rolls || 0,
          uomId: d.uomId,
          rate: Number(d.rate) || 0,
          amount: Number(d.amount) || 0,
          process: d.process,
          processList: d.processList,
          remarks: d.remarks,
        })),
        taxes: taxes.map((t) => ({
          taxName: t.taxName,
          taxPercentage: Number(t.taxPercentage) || 0,
          taxAmount: Number(t.taxAmount) || 0,
        })),
      };

      if (editingId) {
        await updateFabricBill(editingId, data);
        message.success("Updated successfully");
      } else {
        await createFabricBill(data);
        message.success("Created successfully");
      }

      setIsFormVisible(false);
      loadData();
    } catch (error) {
      message.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDetail = () => {
    setDetails([
      ...details,
      {
        key: Date.now(),
        weight: 0,
        rolls: 0,
        rate: 0,
        amount: 0,
        processes: [],
        originalProcesses: [],
        process: "",
        processList: "",
      },
    ]);
    // Calculate totals after adding detail
    setTimeout(() => {
      calculateTotals();
    }, 100);
  };

  const handleDeleteDetail = (key) => {
    setDetails(details.filter((d) => d.key !== key));
    setTimeout(() => {
      calculateTotals();
    }, 100);
  };

  const handleDetailChange = (key, field, value) => {
    setDetails(
      details.map((d) => {
        if (d.key === key) {
          const updated = { ...d, [field]: value };
          if (field === "weight" || field === "rate") {
            updated.amount = (updated.weight || 0) * (updated.rate || 0);
          }
          return updated;
        }
        return d;
      }),
    );
    setTimeout(() => {
      calculateTotals();
    }, 100);
  };

  const autoLoadTaxes = (partyId) => {
    const totalAmount = form.getFieldValue("totalAmount") || 0;

    if (!partyId || !concernData) {
      return;
    }

    const selectedParty = parties.find((p) => p.id === partyId);
    if (!selectedParty) {
      return;
    }

    // Compare concern state with party state
    const concernState = concernData.state?.toLowerCase().trim();
    const partyState = selectedParty.state?.toLowerCase().trim();
    const isSameState = concernState === partyState;

    let loadedTaxes = [];

    if (isSameState) {
      // Same state: Load CGST + SGST
      const cgstTax = gstMasters.find(
        (g) =>
          g.taxName?.toLowerCase().includes("cgst") && g.isLoadDefault === 1,
      );
      const sgstTax = gstMasters.find(
        (g) =>
          g.taxName?.toLowerCase().includes("sgst") && g.isLoadDefault === 1,
      );

      if (cgstTax) {
        const cgstAmount = (totalAmount * Number(cgstTax.taxPercent)) / 100;
        loadedTaxes.push({
          key: Date.now() + cgstTax.id,
          taxName: cgstTax.id,
          taxPercentage: Number(cgstTax.taxPercent),
          taxAmount: cgstAmount,
        });
      }

      if (sgstTax) {
        const sgstAmount = (totalAmount * Number(sgstTax.taxPercent)) / 100;
        loadedTaxes.push({
          key: Date.now() + sgstTax.id + 1,
          taxName: sgstTax.id,
          taxPercentage: Number(sgstTax.taxPercent),
          taxAmount: sgstAmount,
        });
      }
    } else {
      // Different state: Load IGST
      const igstTax = gstMasters.find(
        (g) =>
          g.taxName?.toLowerCase().includes("igst") && g.isLoadDefault === 1,
      );

      if (igstTax) {
        const igstAmount = (totalAmount * Number(igstTax.taxPercent)) / 100;
        loadedTaxes.push({
          key: Date.now() + igstTax.id,
          taxName: igstTax.id,
          taxPercentage: Number(igstTax.taxPercent),
          taxAmount: igstAmount,
        });
      }
    }

    if (loadedTaxes.length > 0) {
      setTaxes(loadedTaxes);
      
      // Calculate totals immediately with the new taxes
      setTimeout(() => {
        calculateTotals();
      }, 100);
    }
  };

  const handleDeleteTax = (key) => {
    setTaxes(taxes.filter((t) => t.key !== key));
    setTimeout(() => {
      calculateTotals();
    }, 100);
  };

  const detailColumns = [
    { title: "Sl", width: 50, render: (_, r, i) => i + 1 },
    {
      title: "Inward No",
      dataIndex: "inwardNo",
      width: 100,
      render: (v) => <span>{v || ''}</span>,
    },
    {
      title: "Our DC No",
      dataIndex: "dcNo",
      width: 100,
      render: (v) => <span>{v || ''}</span>,
    },
    {
      title: "Our DC Date",
      dataIndex: "dcDate",
      width: 120,
      render: (v) => <span>{v ? dayjs(v).format('DD-MM-YYYY') : ''}</span>,
    },
    {
      title: "Fabric",
      dataIndex: "fabricId",
      width: 120,
      render: (v) => <span>{masters.find(m => m.id === v && m.masterType === 'Fabric')?.masterName || ''}</span>,
    },
    {
      title: "Dia",
      dataIndex: "diaId",
      width: 80,
      render: (v) => <span>{masters.find(m => m.id === v && m.masterType === 'Dia')?.masterName || ''}</span>,
    },
    {
      title: "Color",
      dataIndex: "colorId",
      width: 100,
      render: (v) => <span>{masters.find(m => m.id === v && m.masterType === 'Color')?.masterName || ''}</span>,
    },
    {
      title: "GSM",
      dataIndex: "gsm",
      width: 80,
      render: (v) => <span>{v || ''}</span>,
    },
    // Conditionally show design columns if any detail has design data
    ...(details.some((d) => d.designNo || d.designName || d.noOfColor)
      ? [
          {
            title: "Design No",
            dataIndex: "designNo",
            width: 100,
            render: (val) => <span>{val || ''}</span>,
          },
          {
            title: "Design Name",
            dataIndex: "designName",
            width: 120,
            render: (val) => <span>{val || ''}</span>,
          },
          {
            title: "No of Color",
            dataIndex: "noOfColor",
            width: 80,
            render: (val) => <span>{val || 0}</span>,
          },
        ]
      : []),
    {
      title: "Rolls",
      dataIndex: "rolls",
      width: 80,
      render: (v) => <span>{v || 0}</span>,
    },
    {
      title: "Bill Weight",
      dataIndex: "weight",
      width: 100,
      render: (v) => <span>{Number(v || 0).toFixed(3)}</span>,
    },
    {
      title: "Rate",
      dataIndex: "rate",
      width: 100,
      render: (v, r) => {
        if (isAdmin && !isViewMode) {
          return (
            <InputNumber
              value={v}
              onChange={(val) => handleDetailChange(r.key, "rate", val)}
              style={{ width: "100%" }}
              precision={2}
              size="small"
              autoComplete="off"
            />
          );
        }
        return <span>{Number(v || 0).toFixed(2)}</span>;
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 120,
      render: (v) => <span>{Number(v || 0).toFixed(2)}</span>,
    },
    {
      title: "Process",
      dataIndex: "processes",
      width: 200,
      render: (val) => {
        const processText = val && Array.isArray(val) ? val.join(', ') : '';
        return <span>{processText}</span>;
      },
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      width: 120,
      render: (v, r) => (
        <Input
          disabled={isViewMode}
          value={v}
          onChange={(e) => handleDetailChange(r.key, "remarks", e.target.value)}
          size="small"
          autoComplete="off"
        />
      ),
    },
    {
      title: "Action",
      width: 60,
      fixed: "right",
      render: (_, r) =>
        !isViewMode ? (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteDetail(r.key)}
            size="small"
          />
        ) : null,
    },
  ];

  const taxColumns = [
    { title: "Sl", width: 50, render: (_, r, i) => i + 1 },
    {
      title: "Tax Name",
      dataIndex: "taxName",
      width: 150,
      render: (v) => gstMasters.find((g) => g.id === v)?.taxName || "",
    },
    {
      title: "%",
      dataIndex: "taxPercentage",
      width: 80,
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: "Value",
      dataIndex: "taxAmount",
      width: 120,
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: "Action",
      width: 60,
      render: (_, r) =>
        !isViewMode ? (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTax(r.key)}
          />
        ) : null,
    },
  ];

  const listColumns = [
    { title: "S.No", key: "sno", width: 50, render: (_, r, i) => i + 1 },
    { title: "Bill No", dataIndex: "billNo", width: 100 },
    {
      title: "Bill Date",
      dataIndex: "billDate",
      width: 120,
      render: (v) => dayjs(v).format("DD-MM-YYYY"),
    },
    {
      title: "Party",
      dataIndex: "partyId",
      width: 150,
      render: (v) => parties.find((p) => p.id === v)?.partyName || "",
    },
    {
      title: "Total Qty",
      dataIndex: "totalQty",
      width: 100,
      render: (v) => Number(v).toFixed(3),
    },
    {
      title: "Net Amount",
      dataIndex: "netAmount",
      width: 120,
      render: (v) => Number(v).toFixed(2),
    },
    {
      title: "Actions",
      width: 120,
      fixed: "right",
      render: (_, r) => (
        <Space size="small">
          {/* view button always available */}
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(r)}
            style={{ color: "#1890ff" }}
          />
          {canEdit("fabric_bill") && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(r)}
              style={{ color: "#52c41a" }}
            />
          )}
          {canDelete("fabric_bill") && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(r.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  const filteredBills = fabricBills.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return item.billNo?.toLowerCase().includes(search);
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
        .compact-table .ant-select-selector,
        .compact-table .ant-picker {
          font-size: 11px !important;
          min-height: 24px !important;
          height: 24px !important;
        }
        .compact-table .ant-input-number-input,
        .compact-table .ant-picker-input > input {
          height: 22px !important;
        }
        @media (max-width: 768px) {
          .page-header { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .page-header .ant-space { width: 100% !important; }
          .section-header { flex-direction: column !important; gap: 8px !important; align-items: flex-start !important; }
        }
      `}</style>
      <div
        className="page-header"
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={4} style={{ margin: 0, whiteSpace: "nowrap" }}>
          Fabric Bill
        </Title>
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNew}
              disabled={!canAdd("fabric_bill")}
            >
              New
            </Button>
          </Space>
        )}
      </div>

      {!isFormVisible ? (
        <Table
          columns={listColumns}
          dataSource={filteredBills}
          rowKey="id"
          size="small"
          className="compact-table"
          scroll={{ x: 800 }}
        />
      ) : (
        <Form form={form} layout="vertical" size="small">
          <Row gutter={8}>
            <Col span={4}>
              <Form.Item
                label="Bill No"
                name="billNo"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  disabled={isViewMode || (editingId ? true : !isAdmin)}
                  style={{ height: "32px" }}
                  size="middle"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Bill Date"
                name="billDate"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <DatePicker
                  disabled={isViewMode}
                  style={{ width: "100%", height: "32px" }}
                  format="DD-MM-YYYY"
                  size="middle"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Party"
                name="partyId"
                style={{ marginBottom: 6 }}
              >
                <Select
                  disabled={isViewMode}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  style={{ height: "32px" }}
                  size="middle"
                  onChange={handlePartyChange}
                >
                  {parties.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.partyName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                label="E-way No"
                name="ewayNo"
                style={{ marginBottom: 6 }}
              >
                <Input
                  disabled={isViewMode}
                  style={{ height: "32px" }}
                  size="middle"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={5}>
              <Form.Item
                label="HSN Code"
                name="hsnCode"
                style={{ marginBottom: 6 }}
              >
                <Input
                  disabled={isViewMode}
                  style={{ height: "32px" }}
                  size="middle"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Invoice To"
                name="invoiceTo"
                style={{ marginBottom: 6 }}
              >
                <Select
                  disabled={isViewMode}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  style={{ height: "32px" }}
                  size="middle"
                >
                  {parties.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.partyName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Credit Days"
                name="creditDays"
                style={{ marginBottom: 6 }}
              >
                <InputNumber
                  disabled={isViewMode}
                  style={{ width: "100%", height: "32px" }}
                  size="middle"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 4 }}>
            <div
              className="section-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Title level={5} style={{ margin: 0, fontSize: "14px" }}>
                Details
              </Title>
              <Space>
                <Button
                  type="dashed"
                  size="small"
                  icon={<UnorderedListOutlined />}
                  onClick={handleLoadDcs}
                  disabled={!selectedParty || isViewMode}
                  style={{
                    backgroundColor: "#722ed1",
                    color: "#fff",
                    borderColor: "#722ed1",
                  }}
                >
                  Load DCs
                </Button>
              </Space>
            </div>
            <Table
              columns={detailColumns}
              dataSource={details}
              pagination={false}
              scroll={{ x: 2000, y: 200 }}
              size="small"
              bordered
              className="compact-table"
            />
          </div>

          <Row gutter={8} style={{ marginTop: 8 }}>
            <Col span={12}>
              <div style={{ marginTop: 4 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Title level={5} style={{ margin: 0, fontSize: "14px" }}>
                    GST
                  </Title>
                </div>
                <Table
                  columns={taxColumns}
                  dataSource={taxes}
                  pagination={false}
                  size="small"
                  className="compact-table"
                />
              </div>
            </Col>
            <Col span={12}>
              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item
                    label="Total Rolls"
                    name="totalRolls"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Total Qty"
                    name="totalQty"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      precision={3}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Total Amount"
                    name="totalAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      precision={2}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="No of Design"
                    name="noOfDesign"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Design Rate"
                    name="designRate"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      precision={2}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Design Amount"
                    name="designAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      precision={2}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="No of Screen"
                    name="noOfScreen"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Screen Rate"
                    name="screenRate"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      precision={2}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Screen Amount"
                    name="screenAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      precision={2}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="GST Amount"
                    name="gstAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      precision={2}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Other Charges"
                    name="otherCharges"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      precision={2}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Round Off"
                    name="roundOff"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      precision={2}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Rec Amount"
                    name="recAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      precision={2}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Diff Amount"
                    name="diffAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      precision={2}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Grant Amount"
                    name="grantAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled={isViewMode}
                      style={{ width: "100%" }}
                      precision={2}
                      onChange={calculateTotals}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Net Amount"
                    name="netAmount"
                    style={{ marginBottom: 6 }}
                  >
                    <InputNumber
                      disabled
                      style={{ width: "100%" }}
                      precision={2}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <div style={{ marginTop: 8, textAlign: "right" }}>
            <Space>
              <Button
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsFormVisible(false);
                  setIsViewMode(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
              {!isViewMode && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={handleSubmit}
                >
                  Save
                </Button>
              )}
            </Space>
          </div>
        </Form>
      )}

      {/* DC Selection Modal */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "-5px 0",
              paddingRight: "20px",
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: "500" }}>
              Select DCs to Add
            </span>
            <Input
              placeholder="Search DCs..."
              value={dcSearchText}
              onChange={(e) => setDcSearchText(e.target.value)}
              style={{
                width: 200,
                height: "28px",
                fontSize: "12px",
                marginRight: "20px",
              }}
              size="small"
              allowClear
              autoComplete="off"
            />
          </div>
        }
        open={dcModalVisible}
        onCancel={() => {
          setDcModalVisible(false);
          setDcSearchText("");
        }}
        onOk={handleAddSelectedDcs}
        width={1200}
        okText={`Add Selected (${selectedDcs.length})`}
        okButtonProps={{ disabled: selectedDcs.length === 0 }}
      >
        <Table
          dataSource={availableDcs.filter((dc) => {
            if (!dcSearchText) return true;
            const search = dcSearchText.toLowerCase();
            return (
              dc.dcNo?.toLowerCase().includes(search) ||
              dayjs(dc.dcDate).format("DD-MM-YYYY").includes(search) ||
              dc.inwardNo?.toLowerCase().includes(search) ||
              dc.pdcNo?.toLowerCase().includes(search) ||
              dc.dcType?.toLowerCase().includes(search) ||
              Number(dc.totalQty || 0)
                .toFixed(3)
                .includes(search) ||
              (dc.totalRolls || 0).toString().includes(search) ||
              (dc.details?.length || 0).toString().includes(search)
            );
          })}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 400 }}
          className="compact-table"
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: selectedDcs,
            onChange: (selectedRowKeys) => setSelectedDcs(selectedRowKeys),
          }}
          columns={[
            {
              title: "DC No",
              dataIndex: "dcNo",
              width: 100,
            },
            {
              title: "DC Date",
              dataIndex: "dcDate",
              width: 100,
              render: (date) => dayjs(date).format("DD-MM-YYYY"),
            },
            {
              title: "Inward No",
              dataIndex: "inwardNo",
              width: 100,
            },
            {
              title: "PDC No",
              dataIndex: "pdcNo",
              width: 100,
            },
            {
              title: "DC Type",
              dataIndex: "dcType",
              width: 120,
            },
            {
              title: "Total Qty",
              dataIndex: "totalQty",
              width: 100,
              render: (qty) => Number(qty || 0).toFixed(3),
            },
            {
              title: "Total Rolls",
              dataIndex: "totalRolls",
              width: 100,
            },
            {
              title: "Items",
              width: 80,
              render: (_, record) => record.details?.length || 0,
            },
          ]}
        />
        <div
          style={{
            marginTop: 16,
            padding: 8,
            backgroundColor: "#f5f5f5",
            borderRadius: 4,
          }}
        >
          <strong>Note:</strong> Only DCs that are not already used in bills and
          not "Re-Process(Free)" type are shown.
        </div>
      </Modal>
    </Card>
  );
};

export default FabricBill;
