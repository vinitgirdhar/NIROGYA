import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Badge,
  Space,
  Statistic,
  List,
  Avatar,
  Tag,
  Modal,
  message,
  Form,
  DatePicker,
  Upload
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EyeOutlined,
  AlertOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  FileProtectOutlined,
  GlobalOutlined,
  CalendarOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import './GovermentReports.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface Report {
  id: string;
  title: string;
  department: string;
  issueDate: string;
  reportType: string;
  region: string;
  status: 'new' | 'updated' | 'urgent';
  description: string;
  downloadUrl: string;
  viewUrl: string;
  tags: string[];
  fileSize: string;
  downloads: number;
}

const GovernmentReports: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [addReportForm] = Form.useForm();
  const translations = {
    governmentReports: {
      title: t('governmentReports.title'),
      subtitle: t('governmentReports.subtitle'),
      publishedStatistics: t('governmentReports.publishedStatistics'),
      totalReports: t('governmentReports.totalReports'),
      reportsThisMonth: t('governmentReports.reportsThisMonth'),
      departmentFilter: t('governmentReports.departmentFilter'),
      yearFilter: t('governmentReports.yearFilter'),
      regionFilter: t('governmentReports.regionFilter'),
      typeFilter: t('governmentReports.typeFilter'),
      selectDepartment: t('governmentReports.selectDepartment'),
      selectYear: t('governmentReports.selectYear'),
      selectRegion: t('governmentReports.selectRegion'),
      selectType: t('governmentReports.selectType'),
      search: t('governmentReports.search'),
      preview: t('governmentReports.preview'),
      downloadPdf: t('governmentReports.downloadPdf'),
      share: t('governmentReports.share'),
      reportPreview: t('governmentReports.reportPreview'),
      reportType: t('governmentReports.reportType'),
      issueDate: t('governmentReports.issueDate'),
      description: t('governmentReports.description'),
      tags: t('governmentReports.tags'),
      downloads: t('governmentReports.downloads'),
      region: t('governmentReports.region'),
      close: t('governmentReports.close'),
      searchCompleted: t('governmentReports.searchCompleted'),
      downloadingReport: t('governmentReports.downloadingReport'),
      linkCopied: t('governmentReports.linkCopied'),
      openingPreview: t('governmentReports.openingPreview'),
      liveUpdates: t('governmentReports.liveUpdates'),
      waterQualityReports: t('governmentReports.waterQualityReports'),
      healthSurveillance: t('governmentReports.healthSurveillance'),
      policyGuidelines: t('governmentReports.policyGuidelines'),
      researchPublications: t('governmentReports.researchPublications'),
      filterDepartment: t('governmentReports.filterDepartment'),
      allDepartments: t('governmentReports.allDepartments'),
      ministryHealth: t('governmentReports.ministryHealth'),
      ministryWater: t('governmentReports.ministryWater'),
      ruralDevelopment: t('governmentReports.ruralDevelopment'),
      environment: t('governmentReports.environment'),
      nationalPrograms: t('governmentReports.nationalPrograms'),
      filterYear: t('governmentReports.filterYear'),
      allYears: t('governmentReports.allYears'),
      filterRegion: t('governmentReports.filterRegion'),
      allRegions: t('governmentReports.allRegions'),
      northeast: t('governmentReports.northeast'),
      districts: t('governmentReports.districts'),
      villages: t('governmentReports.villages'),
      filterType: t('governmentReports.filterType'),
      allTypes: t('governmentReports.allTypes'),
      survey: t('governmentReports.survey'),
      analysis: t('governmentReports.analysis'),
      warning: t('governmentReports.warning'),
      policy: t('governmentReports.policy'),
      research: t('governmentReports.research'),
      dashboard: t('governmentReports.dashboard'),
      searchBtn: t('governmentReports.searchBtn'),
      trend: t('governmentReports.trend'),
      governmentPublications: t('governmentReports.governmentPublications')
    }
  };
  const tr = translations.governmentReports;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [addReportModalVisible, setAddReportModalVisible] = useState(false);
  const [addingReport, setAddingReport] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  // Government reports data using actual PDF files from the report folder
  useEffect(() => {
    setReports([
      {
        id: '1',
        title: 'Water Quality Assessment Report 2025',
        department: 'Ministry of Jal Shakti',
        issueDate: '2025-12-05',
        reportType: 'Assessment',
        region: 'National',
        status: 'new',
        description: 'Comprehensive water quality assessment report covering multiple regions with detailed analysis of water sources and contamination levels.',
        downloadUrl: '/report/water-quality-assessment-2025.pdf',
        viewUrl: '/report/view/water-quality-assessment-2025',
        tags: ['Water Quality', 'Assessment', 'National'],
        fileSize: '2.4 MB',
        downloads: 1248
      },
      {
        id: '2',
        title: 'Waterborne Disease Surveillance Report - December 2025',
        department: 'Ministry of Health & Family Welfare',
        issueDate: '2025-12-04',
        reportType: 'Surveillance',
        region: 'Northeast India',
        status: 'urgent',
        description: 'Critical surveillance report on waterborne disease outbreaks with epidemiological data and response protocols.',
        downloadUrl: '/report/waterborne-disease-surveillance-dec-2025.pdf',
        viewUrl: '/report/view/waterborne-disease-surveillance',
        tags: ['Disease Surveillance', 'Waterborne', 'Emergency Response'],
        fileSize: '1.8 MB',
        downloads: 2156
      },
      {
        id: '3',
        title: 'Rural Water Infrastructure Development Status Report',
        department: 'Department of Drinking Water & Sanitation',
        issueDate: '2025-12-03',
        reportType: 'Infrastructure',
        region: 'Rural Areas',
        status: 'updated',
        description: 'Status report on rural water infrastructure development under Jal Jeevan Mission covering pipeline installations and water treatment facilities.',
        downloadUrl: '/report/rural-water-infrastructure-2025.pdf',
        viewUrl: '/report/view/rural-water-infrastructure',
        tags: ['Rural Infrastructure', 'Jal Jeevan Mission', 'Water Treatment'],
        fileSize: '5.2 MB',
        downloads: 892
      },
      {
        id: '4',
        title: 'Annual Groundwater Quality Report',
        department: 'Central Ground Water Board',
        issueDate: '2024-12-01',
        reportType: 'Annual Report',
        region: 'National',
        status: 'new',
        description: 'Comprehensive annual report on groundwater quality assessment across India with state-wise analysis and recommendations.',
        downloadUrl: '/report/annualgroundwaterqualityreport.pdf',
        viewUrl: '/report/view/groundwater-quality',
        tags: ['Groundwater', 'Quality Assessment', 'Annual Report'],
        fileSize: '11.4 MB',
        downloads: 2876
      },
      {
        id: '5',
        title: 'Annual Report 2022-23',
        department: 'Ministry of Health & Family Welfare',
        issueDate: '2023-03-31',
        reportType: 'Annual Report',
        region: 'National',
        status: 'updated',
        description: 'Annual performance report covering health programs, achievements, and challenges for the financial year 2022-23.',
        downloadUrl: '/report/annual_report2022-23.pdf',
        viewUrl: '/report/view/annual-report-2022-23',
        tags: ['Annual Report', 'Health Programs', 'Performance'],
        fileSize: '7.8 MB',
        downloads: 2890
      },
      {
        id: '6',
        title: 'Annual Report 2023-24',
        department: 'Ministry of Health & Family Welfare',
        issueDate: '2024-03-31',
        reportType: 'Annual Report',
        region: 'National',
        status: 'new',
        description: 'Annual performance report covering health programs, achievements, challenges, and future plans for the financial year 2023-24.',
        downloadUrl: '/report/annual_report2023-24.pdf',
        viewUrl: '/report/view/annual-report-2023-24',
        tags: ['Annual Report', 'Health Programs', 'Performance'],
        fileSize: '8.7 MB',
        downloads: 3254
      },
      {
        id: '7',
        title: 'Draft State Water Policy - Meghalaya',
        department: 'Government of Meghalaya - Water Resources Department',
        issueDate: '2019-07-25',
        reportType: 'Policy Draft',
        region: 'Meghalaya',
        status: 'updated',
        description: 'Draft state water policy document outlining water resource management strategies, conservation measures, and regulatory frameworks for Meghalaya.',
        downloadUrl: '/report/Draft_State_Water_Policy_DSWP_25.07.2019_APPROVED.pdf',
        viewUrl: '/report/view/draft-water-policy',
        tags: ['Water Policy', 'Meghalaya', 'Water Resources', 'Conservation'],
        fileSize: '3.8 MB',
        downloads: 987
      },
      {
        id: '8',
        title: 'Evaluation Study on Water Supply',
        department: 'Department of Drinking Water & Sanitation',
        issueDate: '2024-07-10',
        reportType: 'Evaluation Study',
        region: 'Multi-State',
        status: 'new',
        description: 'Comprehensive evaluation study on water supply systems, infrastructure, and service delivery across multiple states.',
        downloadUrl: '/report/Evaluation Study on water supply.pdf',
        viewUrl: '/report/view/water-supply-evaluation',
        tags: ['Water Supply', 'Evaluation', 'Infrastructure', 'Service Delivery'],
        fileSize: '9.4 MB',
        downloads: 1723
      },
      {
        id: '9',
        title: 'Forest Report - Meghalaya 2020',
        department: 'Ministry of Environment, Forest and Climate Change',
        issueDate: '2020-12-15',
        reportType: 'Environmental Report',
        region: 'Meghalaya',
        status: 'updated',
        description: 'Comprehensive forest cover assessment and biodiversity report for Meghalaya state covering forest conservation efforts.',
        downloadUrl: '/report/FR-Meghalaya-2020.pdf',
        viewUrl: '/report/view/forest-report-meghalaya',
        tags: ['Forest Cover', 'Meghalaya', 'Environment', 'Biodiversity'],
        fileSize: '15.2 MB',
        downloads: 1456
      },
      {
        id: '10',
        title: 'Government of Meghalaya - Official Report',
        department: 'Government of Meghalaya',
        issueDate: '2024-08-20',
        reportType: 'Official Report',
        region: 'Meghalaya',
        status: 'new',
        description: 'Official government report covering administrative activities, development programs, and policy implementations.',
        downloadUrl: '/report/gov report for meghalaya org.pdf',
        viewUrl: '/report/view/gov-report-meghalaya',
        tags: ['Government', 'Meghalaya', 'Administration', 'Development'],
        fileSize: '6.8 MB',
        downloads: 987
      },
      {
        id: '11',
        title: 'Government of Meghalaya',
        department: 'Government of Meghalaya',
        issueDate: '2024-09-15',
        reportType: 'Administrative Report',
        region: 'Meghalaya',
        status: 'new',
        description: 'Administrative report from Government of Meghalaya covering departmental activities and governance initiatives.',
        downloadUrl: '/report/GOVERNMENT OF MEGHALAYA-.pdf',
        viewUrl: '/report/view/government-meghalaya',
        tags: ['Government', 'Meghalaya', 'Administration', 'Governance'],
        fileSize: '5.3 MB',
        downloads: 1123
      },
      {
        id: '12',
        title: 'Guidelines for Recognition of Laboratories',
        department: 'Ministry of Health & Family Welfare',
        issueDate: '2023-08-10',
        reportType: 'Guidelines',
        region: 'National',
        status: 'updated',
        description: 'Official guidelines for recognition and accreditation of laboratories for water quality testing and health diagnostics.',
        downloadUrl: '/report/Guidelines_for_Recognition_of_Laboratories.pdf',
        viewUrl: '/report/view/laboratory-guidelines',
        tags: ['Laboratory Guidelines', 'Recognition', 'Quality Testing'],
        fileSize: '2.9 MB',
        downloads: 1234
      },
      {
        id: '13',
        title: 'IWC Report Final',
        department: 'Ministry of Jal Shakti',
        issueDate: '2025-01-20',
        reportType: 'Technical Report',
        region: 'National',
        status: 'new',
        description: 'Final report on water infrastructure and conservation initiatives with technical recommendations.',
        downloadUrl: '/report/iwc-report-final-12025.pdf',
        viewUrl: '/report/view/iwc-report-final',
        tags: ['Water Infrastructure', 'Conservation', 'Technical Report'],
        fileSize: '8.9 MB',
        downloads: 856
      },
      {
        id: '14',
        title: 'Jal Jeevan Mission Report for Meghalaya',
        department: 'Department of Drinking Water & Sanitation',
        issueDate: '2024-11-15',
        reportType: 'Program Report',
        region: 'Meghalaya',
        status: 'new',
        description: 'Progress report on Jal Jeevan Mission implementation in Meghalaya covering rural water supply connections.',
        downloadUrl: '/report/jaljeeveanreportformeghalaya.pdf',
        viewUrl: '/report/view/jal-jeevan-meghalaya',
        tags: ['Jal Jeevan Mission', 'Meghalaya', 'Rural Water', 'Progress Report'],
        fileSize: '5.6 MB',
        downloads: 2134
      },
      {
        id: '15',
        title: 'Meghalaya Health Policy 2021',
        department: 'Government of Meghalaya - Health Department',
        issueDate: '2021-11-12',
        reportType: 'Policy',
        region: 'Meghalaya',
        status: 'new',
        description: 'Comprehensive health policy document for Meghalaya state covering healthcare infrastructure, service delivery, and public health initiatives.',
        downloadUrl: '/report/Meghalaya Health Policy 2021.pdf',
        viewUrl: '/report/view/meghalaya-health-policy',
        tags: ['Health Policy', 'Meghalaya', 'Healthcare', 'Public Health'],
        fileSize: '4.2 MB',
        downloads: 1567
      },
      {
        id: '16',
        title: 'Meghalaya State Report',
        department: 'Government of Meghalaya',
        issueDate: '2024-08-30',
        reportType: 'State Report',
        region: 'Meghalaya',
        status: 'new',
        description: 'Comprehensive state report covering various departments and developmental activities in Meghalaya.',
        downloadUrl: '/report/meghalayastate.pdf',
        viewUrl: '/report/view/meghalaya-state',
        tags: ['State Report', 'Meghalaya', 'Development', 'Governance'],
        fileSize: '7.2 MB',
        downloads: 1789
      },
      {
        id: '17',
        title: 'Ministry of Community and Health Department Report',
        department: 'Ministry of Health & Family Welfare',
        issueDate: '2024-10-18',
        reportType: 'Departmental Report',
        region: 'National',
        status: 'new',
        description: 'Comprehensive report on community health programs, outreach activities, and public health initiatives.',
        downloadUrl: '/report/ministryofcommunityandhealthdepartment.pdf',
        viewUrl: '/report/view/community-health-ministry',
        tags: ['Community Health', 'Public Health', 'Ministry Report', 'National'],
        fileSize: '8.1 MB',
        downloads: 1945
      },
      {
        id: '18',
        title: 'Ministry of Health and Welfare Report',
        department: 'Ministry of Health & Family Welfare',
        issueDate: '2024-11-22',
        reportType: 'Ministry Report',
        region: 'National',
        status: 'new',
        description: 'Latest report from Ministry of Health and Family Welfare covering national health programs and welfare schemes.',
        downloadUrl: '/report/ministryofhealthandwelfare.pdf',
        viewUrl: '/report/view/health-welfare-ministry',
        tags: ['Ministry Report', 'Health Welfare', 'National Programs', 'Healthcare'],
        fileSize: '10.7 MB',
        downloads: 3456
      },
      {
        id: '19',
        title: 'MOTHER - Meghalaya State Health Policy',
        department: 'Government of Meghalaya - Health Department',
        issueDate: '2020-11-12',
        reportType: 'Health Policy',
        region: 'Meghalaya',
        status: 'updated',
        description: 'Comprehensive maternal and child health policy document for Meghalaya focusing on healthcare delivery improvements.',
        downloadUrl: '/report/MOTHER - Meghalaya State Health Policy_12.11.2020.pdf',
        viewUrl: '/report/view/mother-health-policy',
        tags: ['Health Policy', 'Maternal Health', 'Child Health', 'Meghalaya'],
        fileSize: '4.7 MB',
        downloads: 1876
      },
      {
        id: '20',
        title: 'Research Paper - Health Department Meghalaya',
        department: 'Government of Meghalaya - Health Department',
        issueDate: '2024-05-25',
        reportType: 'Research Paper',
        region: 'Meghalaya',
        status: 'new',
        description: 'Research publication on health outcomes, disease patterns, and healthcare interventions in Meghalaya.',
        downloadUrl: '/report/research_paper of  health department meghalaya.pdf',
        viewUrl: '/report/view/health-research-meghalaya',
        tags: ['Research', 'Health Department', 'Meghalaya', 'Healthcare'],
        fileSize: '3.9 MB',
        downloads: 1234
      },
      {
        id: '21',
        title: 'State Action Plan for Climate Change & Human Health',
        department: 'Ministry of Health & Family Welfare',
        issueDate: '2024-09-20',
        reportType: 'Action Plan',
        region: 'Multi-State',
        status: 'urgent',
        description: 'Strategic action plan addressing the intersection of climate change and human health with adaptation and mitigation strategies.',
        downloadUrl: '/report/STATE ACTION PLAN FOR CLIMATE CHANGE & HUMAN HEALTH.pdf',
        viewUrl: '/report/view/climate-health-action-plan',
        tags: ['Climate Change', 'Human Health', 'Action Plan', 'Adaptation'],
        fileSize: '7.6 MB',
        downloads: 1654
      },
      {
        id: '22',
        title: 'Statistics Report for Meghalaya',
        department: 'Government of Meghalaya - Statistics Department',
        issueDate: '2024-09-30',
        reportType: 'Statistical Report',
        region: 'Meghalaya',
        status: 'new',
        description: 'Comprehensive statistical data covering demographics, health indicators, and socio-economic parameters for Meghalaya.',
        downloadUrl: '/report/statisticsreportformeghalaya.pdf',
        viewUrl: '/report/view/statistics-meghalaya',
        tags: ['Statistics', 'Demographics', 'Meghalaya', 'Socio-Economic'],
        fileSize: '12.3 MB',
        downloads: 2567
      },
      {
        id: '23',
        title: 'Water Quality Status of Water Bodies - Garo and East Khasi Hills',
        department: 'Meghalaya State Pollution Control Board (MSPCB)',
        issueDate: '2024-06-15',
        reportType: 'Monitoring Report',
        region: 'Meghalaya',
        status: 'new',
        description: 'Detailed monitoring report on water quality status of various water bodies in Garo Hills and East Khasi Hills districts.',
        downloadUrl: '/report/Water_Quality_Status_of_Water_Bodies_in_Garo_and_ East_Khasi_Hills_monitored_by_MSPCB.pdf',
        viewUrl: '/report/view/water-quality-garo-khasi',
        tags: ['Water Quality', 'Monitoring', 'Garo Hills', 'Khasi Hills'],
        fileSize: '6.1 MB',
        downloads: 743
      }
    ]);
  }, []);

  const handleSearch = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      message.success(tr.searchCompleted);
    }, 1000);
  };

  const handleDownload = (report: Report) => {
    // Create a temporary download link using the report folder path
    const link = document.createElement('a');
    link.href = report.downloadUrl;
    link.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success({
      content: `${tr.downloadingReport}: ${report.title}`,
      duration: 3,
      style: { marginTop: '20px' }
    });
    
    // Update download count (in a real app, this would be an API call)
    setReports(prev => 
      prev.map(r => 
        r.id === report.id 
          ? { ...r, downloads: r.downloads + 1 }
          : r
      )
    );
  };

  const handleShare = (report: Report) => {
    navigator.clipboard.writeText(`Check out this government report: ${report.title}`);
    message.success(tr.linkCopied);
  };

  const handleView = (report: Report) => {
    setSelectedReportForPreview(report);
    setPreviewVisible(true);
    message.info(`${tr.openingPreview}: ${report.title}`);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
    setSelectedReportForPreview(null);
  };

  // Add Report handlers
  const handleOpenAddReportModal = () => {
    setAddReportModalVisible(true);
  };

  const handleCloseAddReportModal = () => {
    setAddReportModalVisible(false);
    addReportForm.resetFields();
    setUploadedFile(null);
  };

  const handleAddReport = async (values: any) => {
    setAddingReport(true);
    try {
      const newReport: Report = {
        id: String(Date.now()),
        title: values.title,
        department: values.department,
        issueDate: values.issueDate.format('YYYY-MM-DD'),
        reportType: values.reportType,
        region: values.region,
        status: values.status || 'new',
        description: values.description,
        downloadUrl: values.downloadUrl || `/report/${values.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        viewUrl: `/report/view/${values.title.replace(/[^a-zA-Z0-9]/g, '-')}`,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
        fileSize: uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
        downloads: 0
      };

      setReports(prev => [newReport, ...prev]);
      message.success('Report added successfully!');
      handleCloseAddReportModal();
    } catch (error) {
      message.error('Failed to add report');
    } finally {
      setAddingReport(false);
    }
  };

  const handleFileUpload = (info: any) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      setUploadedFile(info.file.originFileObj || info.file);
      message.success(`${info.file.name} file selected`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'red';
      case 'new': return 'green';
      case 'updated': return 'blue';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'urgent': return 'URGENT';
      case 'new': return 'NEW';
      case 'updated': return 'UPDATED';
      default: return status;
    }
  };

  const dashboardData = [
    { title: tr.waterQualityReports, count: 1247, icon: <EnvironmentOutlined />, color: '#1890ff', trend: '+12%' },
    { title: tr.healthSurveillance, count: 856, icon: <AlertOutlined />, color: '#f5222d', trend: '+8%' },
    { title: tr.policyGuidelines, count: 423, icon: <FileProtectOutlined />, color: '#52c41a', trend: '+15%' },
    { title: tr.researchPublications, count: 1834, icon: <BarChartOutlined />, color: '#722ed1', trend: '+23%' }
  ];

  return (
    <div className="government-reports-page">
      {/* Header Section */}
      <div className="reports-header">
        <div className="header-content">
          <Title level={2} className="page-title">
            <GlobalOutlined /> Government Reports & Publications Portal
          </Title>
          <Text className="page-subtitle">
            Access official government reports, health bulletins, water quality assessments, and policy documents
          </Text>
        </div>
      </div>

      {/* Search & Filters Section */}
      <Card className="search-filters-card" bordered={false}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder={tr.search}
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} md={16}>
            <Space wrap>
              <Select
                placeholder={tr.filterDepartment}
                style={{ minWidth: 150 }}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
              >
                <Option value="all">{tr.allDepartments}</Option>
                <Option value="health">{tr.ministryHealth}</Option>
                <Option value="water">{tr.ministryWater}</Option>
                <Option value="rural">{tr.ruralDevelopment}</Option>
                <Option value="environment">{tr.environment}</Option>
                <Option value="national">{tr.nationalPrograms}</Option>
              </Select>

              <Select
                placeholder={tr.filterYear}
                style={{ minWidth: 100 }}
                value={selectedYear}
                onChange={setSelectedYear}
              >
                <Option value="all">{tr.allYears}</Option>
                <Option value="2025">2025</Option>
                <Option value="2024">2024</Option>
                <Option value="2023">2023</Option>
                <Option value="2022">2022</Option>
              </Select>

              <Select
                placeholder={tr.filterRegion}
                style={{ minWidth: 130 }}
                value={selectedRegion}
                onChange={setSelectedRegion}
              >
                <Option value="all">{tr.allRegions}</Option>
                <Option value="northeast">{tr.northeast}</Option>
                <Option value="districts">{tr.districts}</Option>
                <Option value="villages">{tr.villages}</Option>
              </Select>

              <Select
                placeholder={tr.filterType}
                style={{ minWidth: 130 }}
                value={selectedType}
                onChange={setSelectedType}
              >
                <Option value="all">{tr.allTypes}</Option>
                <Option value="survey">{tr.survey}</Option>
                <Option value="analysis">{tr.analysis}</Option>
                <Option value="warning">{tr.warning}</Option>
                <Option value="policy">{tr.policy}</Option>
                <Option value="research">{tr.research}</Option>
                <Option value="dashboard">{tr.dashboard}</Option>
              </Select>

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                {tr.search}
              </Button>

              {/* Add Report Button - Only visible to government users */}
              {user && ['government_body', 'admin'].includes(user.role) && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenAddReportModal}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Add Report
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Dashboard Overview - Publication Statistics */}
      <Card className="overview-card" title={tr.publishedStatistics} bordered={false}>
        <Row gutter={[16, 16]}>
          {dashboardData.map((item, index) => (
            <Col xs={12} md={6} key={index}>
              <Card className="stat-card" style={{ borderLeft: `4px solid ${item.color}` }}>
                <Statistic
                  title={item.title}
                  value={item.count}
                  prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                  suffix={
                    <span style={{ fontSize: '14px', color: '#52c41a', marginLeft: '8px' }}>
                      {item.trend}
                    </span>
                  }
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>{tr.trend}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Latest Reports Section */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            <span>{tr.governmentPublications}</span>
            <Badge count={tr.liveUpdates} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        className="latest-reports-card"
        bordered={false}
      >
        <List
          itemLayout="vertical"
          dataSource={reports}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reports`,
          }}
          renderItem={(report) => (
            <List.Item
              key={report.id}
              className="professional-report-item"
              actions={[
                <Button
                  type="primary"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleView(report)}
                >
                  {tr.preview}
                </Button>,
                <Button
                  type="default"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(report)}
                >
                  {tr.downloadPdf}
                </Button>,
                <Button
                  type="text"
                  size="small"
                  icon={<ShareAltOutlined />}
                  onClick={() => handleShare(report)}
                >
                  {tr.share}
                </Button>
              ]}
              extra={
                <div className="report-meta-enhanced">
                  <Tag color={getStatusColor(report.status)} style={{ marginBottom: 8 }}>
                    {getStatusText(report.status)}
                  </Tag>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <CalendarOutlined /> {report.issueDate}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                    Size: {report.fileSize} | Downloads: {report.downloads}
                  </div>
                </div>
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    size={64}
                    icon={<FileTextOutlined />} 
                    style={{ 
                      backgroundColor: report.status === 'urgent' ? '#ff4d4f' : '#1890ff',
                      fontSize: '24px'
                    }} 
                  />
                }
                title={
                  <div className="report-title-section">
                    <Title level={4} style={{ marginBottom: 0, color: '#1890ff' }}>
                      {report.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {report.department} | {report.region}
                    </Text>
                  </div>
                }
                description={
                  <div className="report-description-section">
                    <Text style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {report.description}
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Space wrap>
                        {report.tags.map(tag => (
                          <Tag key={tag} color="blue" style={{ fontSize: '11px' }}>
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </div>
                }
              />
              <div className="report-content">
                <Text strong style={{ color: '#1890ff' }}>{tr.reportType}: </Text>
                <Text>{report.reportType}</Text>
                <br />
                <Text strong style={{ color: '#1890ff' }}>{tr.issueDate}: </Text>
                <Text>{report.issueDate}</Text>
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* PDF Preview Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {selectedReportForPreview?.title}
              </div>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: 400 }}>
                {selectedReportForPreview?.department}
              </div>
            </div>
          </div>
        }
        open={previewVisible}
        onCancel={handleClosePreview}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedReportForPreview && handleDownload(selectedReportForPreview)}
          >
            {tr.downloadPdf}
          </Button>,
          <Button key="share" 
            icon={<ShareAltOutlined />}
            onClick={() => selectedReportForPreview && handleShare(selectedReportForPreview)}
          >
            {tr.share}
          </Button>,
          <Button key="close" onClick={handleClosePreview}>
            {tr.close}
          </Button>
        ]}
      >
        {selectedReportForPreview && (
          <div className="pdf-preview-container">
            <div className="pdf-info-bar">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <Space>
                    <Tag color={getStatusColor(selectedReportForPreview.status)}>
                      {getStatusText(selectedReportForPreview.status)}
                    </Tag>
                    <Text type="secondary">
                      <CalendarOutlined /> {selectedReportForPreview.issueDate}
                    </Text>
                    <Text type="secondary">
                      {selectedReportForPreview.fileSize}
                    </Text>
                    <Text type="secondary">
                      {selectedReportForPreview.downloads} {tr.downloads}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                  <Space>
                    <Text strong>{tr.region}: </Text>
                    <Text>{selectedReportForPreview.region}</Text>
                    <Text strong>{tr.reportType}: </Text>
                    <Text>{selectedReportForPreview.reportType}</Text>
                  </Space>
                </Col>
              </Row>
            </div>
            
            <div className="pdf-viewer-wrapper">
              <iframe
                src={selectedReportForPreview.downloadUrl}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                title={`Preview: ${selectedReportForPreview.title}`}
              />
            </div>
            
            <div className="pdf-description-section" style={{ marginTop: 16 }}>
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>{tr.description}:</Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {selectedReportForPreview.description}
                </Text>
              </div>
              <div style={{ marginTop: 12 }}>
                <Text strong style={{ color: '#1890ff' }}>{tr.tags}: </Text>
                <Space wrap style={{ marginTop: 4 }}>
                  {selectedReportForPreview.tags.map(tag => (
                    <Tag key={tag} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Report Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusOutlined style={{ color: '#52c41a' }} />
            <span>Add New Government Report</span>
          </div>
        }
        open={addReportModalVisible}
        onCancel={handleCloseAddReportModal}
        footer={null}
        width={700}
      >
        <Form
          form={addReportForm}
          layout="vertical"
          onFinish={handleAddReport}
          initialValues={{ region: 'National', status: 'new' }}
        >
          <Form.Item
            name="title"
            label="Report Title"
            rules={[{ required: true, message: 'Please enter report title' }]}
          >
            <Input placeholder="Enter report title" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Department"
                rules={[{ required: true, message: 'Please enter department' }]}
              >
                <Input placeholder="e.g., Ministry of Health & Family Welfare" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="issueDate"
                label="Issue Date"
                rules={[{ required: true, message: 'Please select issue date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reportType"
                label="Report Type"
                rules={[{ required: true, message: 'Please select report type' }]}
              >
                <Select placeholder="Select report type">
                  <Option value="Assessment">Assessment</Option>
                  <Option value="Surveillance">Surveillance</Option>
                  <Option value="Annual Report">Annual Report</Option>
                  <Option value="Policy">Policy</Option>
                  <Option value="Guidelines">Guidelines</Option>
                  <Option value="Research Paper">Research Paper</Option>
                  <Option value="Technical Report">Technical Report</Option>
                  <Option value="Statistical Report">Statistical Report</Option>
                  <Option value="Monitoring Report">Monitoring Report</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="region"
                label="Region"
                rules={[{ required: true, message: 'Please enter region' }]}
              >
                <Input placeholder="National" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Option value="new">New</Option>
                  <Option value="updated">Updated</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="file"
                label="Upload File"
              >
                <Upload
                  beforeUpload={() => false}
                  onChange={handleFileUpload}
                  maxCount={1}
                  accept=".pdf,.doc,.docx"
                >
                  <Button icon={<UploadOutlined />}>Select File</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter detailed description of the report" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags (comma separated)"
            rules={[{ required: true, message: 'Please enter tags' }]}
          >
            <Input placeholder="e.g., Water Quality, Assessment, National" />
          </Form.Item>

          <Form.Item
            name="downloadUrl"
            label="Download URL (optional)"
          >
            <Input placeholder="e.g., /report/report-name.pdf" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseAddReportModal}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={addingReport} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                Add Report
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GovernmentReports;