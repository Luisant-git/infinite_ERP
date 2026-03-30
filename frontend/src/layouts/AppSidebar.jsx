import React, { useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  BarChartOutlined,
  SettingOutlined,
  DatabaseOutlined,
  FileProtectOutlined,
  UsergroupAddOutlined,
  ContactsOutlined,
  ClusterOutlined,
  FormatPainterOutlined,
  NodeIndexOutlined,
  PercentageOutlined,
  DollarOutlined,
  InteractionOutlined,
  SolutionOutlined,
  LoginOutlined,
  LogoutOutlined,
  RollbackOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  FileAddOutlined,
  CloudServerOutlined,
  AuditOutlined,
  HighlightOutlined,
  FileExclamationOutlined,
  ReconciliationOutlined,
  VerifiedOutlined,
  BankOutlined,
  FolderOpenOutlined,
  WalletOutlined,
  BookOutlined,
  ProfileOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  ControlOutlined,
  SafetyCertificateOutlined,
  FolderOutlined,
  FolderAddOutlined,
  IdcardOutlined,
  TagsOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  ProjectOutlined,
  DiffOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { usePermissions } from "../hooks/usePermissions";
import { useMenuPermissions } from "../hooks/useMenuPermissions";
import { ROUTES } from "../constants/permissions";
import { toggleSidebar } from "../store/slices/uiSlice";

const { Sider } = Layout;

const AppSidebar = ({ collapsed, isMobile }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { canDCClose, canSettings, user, isMD } = usePermissions();
  const { canView } = useMenuPermissions();
  const menuItems = [
    ...(canView("dashboard")
      ? [
          {
            key: ROUTES.DASHBOARD,
            icon: <DashboardOutlined />,
            label: "Dashboard",
          },
        ]
      : []),
    {
      key: "masters",
      icon: <FolderOutlined />,
      label: "Masters",
      children: [
        ...(user?.adminUser === true
          ? [
              ...(canView("user_master")
                ? [
                    {
                      key: ROUTES.USER_MASTER,
                      icon: <UserAddOutlined />,
                      label: "Login Creation",
                    },
                  ]
                : []),
              ...(canView("concern_master")
                ? [
                    {
                      key: ROUTES.CONCERN_MASTER,
                      icon: <ShopOutlined />,
                      label: "Concern Master",
                    },
                  ]
                : []),
            ]
          : []),
        ...(canView("party_master")
          ? [
              {
                key: ROUTES.PARTY_MASTER,
                icon: <IdcardOutlined />,
                label: "Party Master",
              },
            ]
          : []),
        ...(canView("party_type_master")
          ? [
              {
                key: ROUTES.PARTY_TYPE_MASTER,
                icon: <TagsOutlined />,
                label: "Party Type",
              },
            ]
          : []),
        ...(canView("design_master")
          ? [
              {
                key: ROUTES.DESIGN_MASTER,
                icon: <FileImageOutlined />,
                label: "Design Master",
              },
            ]
          : []),
        ...(canView("process_master")
          ? [
              {
                key: ROUTES.PROCESS_MASTER,
                icon: <NodeIndexOutlined />,
                label: "Process Master",
              },
            ]
          : []),
        ...(canView("party_process_rate")
          ? [
              {
                key: ROUTES.PARTY_PROCESS_RATE,
                icon: <PercentageOutlined />,
                label: "Party Process Rate",
              },
            ]
          : []),
        ...(canView("party_screen_rate")
          ? [
              {
                key: ROUTES.PARTY_SCREEN_RATE,
                icon: <DollarOutlined />,
                label: "Screen Rate Fixing",
              },
            ]
          : []),
        ...(canView("master_data")
          ? [
              {
                key: ROUTES.MASTER_DATA,
                icon: <DatabaseOutlined />,
                label: "Master Data",
              },
            ]
          : []),
        ...(canView("gst_master")
          ? [
              {
                key: ROUTES.GST_MASTER,
                icon: <FileProtectOutlined />,
                label: "GST Master",
              },
            ]
          : []),
      ].filter((item) => item),
    },
    {
      key: "transactions",
      icon: <FolderAddOutlined />,
      label: "Transactions",
      children: [
        {
          key: ROUTES.RATE_QUOTATION,
          icon: <FileSearchOutlined />,
          label: "Rate Quotation",
        },
        {
          key: ROUTES.FABRIC_INWARD,
          icon: <FileAddOutlined />,
          label: "Fabric Inward",
        },
        {
          key: ROUTES.FABRIC_DC,
          icon: <FileTextOutlined />,
          label: "Fabric DC",
        },
        {
          key: ROUTES.FABRIC_RETURN,
          icon: <RollbackOutlined />,
          label: "Fabric Return",
        },
        {
          key: ROUTES.INWARD_CLOSER,
          icon: <CloseCircleOutlined />,
          label: "Inward Closer",
        },
        {
          key: ROUTES.FABRIC_BILL,
          icon: <FileDoneOutlined />,
          label: "Fabric Bill",
        },
        {
          key: ROUTES.DIRECT_BILL,
          icon: <FileAddOutlined />,
          label: "Direct Bill",
        },
        {
          key: ROUTES.BILL_EINVOICE,
          icon: <CloudServerOutlined />,
          label: "Bill E-invoice",
        },
      ],
    },
    ...(isMD === 1
      ? [
          {
            key: "approval",
            icon: <AuditOutlined />,
            label: "Approval",
            children: [
              {
                key: ROUTES.PARTY_APPROVAL,
                icon: <UsergroupAddOutlined />,
                label: "Party Approval",
              },
              {
                key: ROUTES.DESIGN_APPROVAL,
                icon: <HighlightOutlined />,
                label: "Design Approval",
              },
              {
                key: ROUTES.STRIKEOFF_APPROVAL,
                icon: <FileExclamationOutlined />,
                label: "Strike Off Approval",
              },
              {
                key: ROUTES.RATE_QUOTATION_APPROVAL,
                icon: <ReconciliationOutlined />,
                label: "Rate Quotation Approval",
              },
              {
                key: ROUTES.BILL_APPROVAL,
                icon: <VerifiedOutlined />,
                label: "Bill Approval",
              },
            ],
          },
        ]
      : []),
    {
      key: "accounts",
      icon: <FolderOpenOutlined />,
      label: "Accounts",
      children: [
        {
          key: ROUTES.PARTY_OPENING,
          icon: <DiffOutlined />,
          label: "Party Opening",
        },
        {
          key: ROUTES.COLLECTION,
          icon: <WalletOutlined />,
          label: "Collection",
        },
        {
          key: ROUTES.PARTY_LEDGER,
          icon: <BookOutlined />,
          label: "Party Ledger",
        },
      ],
    },
    {
      key: "reports",
      icon: <ProjectOutlined />,
      label: "Reports",
      children: [
        {
          key: ROUTES.INWARD_SUMMARY,
          icon: <ProfileOutlined />,
          label: "Inward Summary",
        },
        {
          key: ROUTES.UN_DC_LIST,
          icon: <FieldTimeOutlined />,
          label: "Un-DC List",
        },
        {
          key: ROUTES.UN_BILL_LIST,
          icon: <HistoryOutlined />,
          label: "Un-Bill List",
        },
      ],
    },
    ...(canSettings()
      ? [
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Settings",
            children: [
              {
                key: ROUTES.SETTINGS,
                icon: <ControlOutlined />,
                label: "General Settings",
              },
              {
                key: ROUTES.EINVOICE_SETTINGS,
                icon: <SafetyCertificateOutlined />,
                label: "E-invoice Settings",
              },
            ],
          },
        ]
      : []),
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile && !collapsed) {
      dispatch(toggleSidebar());
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        background: "#001529",
        ...(isMobile && {
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          transform: collapsed ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 0.3s ease",
        }),
      }}
      width={isMobile ? 250 : 200}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default AppSidebar;
