import React, { useMemo, useState } from "react";
import { Typography, Card, Button, Space, Tag, Divider, Modal, List } from "antd";
import {
  PlayCircleOutlined,
  FileTextOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  TeamOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import "./Education.css";

const { Title, Paragraph } = Typography;

type LanguageCode = "english" | "hindi" | "manipuri" | "khasi";

interface DiseaseCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  videos: number;
  resources: number;
}

interface DiseaseInfo {
  id: string;
  title: string;
  symptoms: string[];
  prevention: string[];
  immediateAction: string[];
  whenToSeekHelp: string[];
  hometreatment?: string[];
}

interface Language {
  code: LanguageCode;
  name: string;
  native: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: string;
  language: string;
  embedUrl?: string;
}

/* Translations (double-quoted strings to avoid parser errors) */
const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  english: {
    brand: "Nirogya",
    heroTitle: "Learn About Water-Borne Diseases",
    heroSubtitle:
      "Access clear, local-language educational resources to protect your community from cholera and other water-borne illnesses.",
    chooseLanguage: "Choose Your Language",
    languageSubtitle:
      "Select a language to view videos and guides in your native tongue.",
    diseaseCategories: "Disease Categories",
    diseaseSubtitle: "Information on common water-borne diseases and prevention.",
    videoLessons: "Video Lessons",
    videosSubtitle: "Watch concise, step-by-step video lessons in",
    quickGuide: "Quick Action Guide",
    quickGuideSubtitle:
      "Immediate steps to take if a water-borne illness is suspected in your area.",
    preventionTips: "Prevention Tips",
    preventionSubtitle: "Simple, practical steps to reduce the risk of infection.",
    emergencyContacts: "Emergency Contacts",
    emergencySubtitle:
      "If symptoms are severe, use the contacts below or visit your local health center.",
    resources: "Downloadable Resources",
    resourcesSubtitle: "Posters, guides and quick reference PDFs for community use.",
    reportEmergency: "Report Emergency",
    findClinic: "Find Nearest Clinic",
    noVideos: "No Videos Available",
    noVideosSub:
      "{topic} videos in {lang} are coming soon. Try English or another language to view content.",
  },
  hindi: {
    brand: "निरोग्य",
    heroTitle: "जल-जनित रोगों के बारे में जानें",
    heroSubtitle:
      "अपने समुदाय को हैजा और अन्य जल-जनित बीमारियों से बचाने के लिए सरल, स्थानीय भाषा में शैक्षिक सामग्री प्राप्त करें।",
    chooseLanguage: "अपनी भाषा चुनें",
    languageSubtitle: "अपनी स्थानीय भाषा में वीडियो और मार्गदर्शिका देखने के लिए भाषा चुनें।",
    diseaseCategories: "रोग श्रेणियाँ",
    diseaseSubtitle: "सामान्य जल-जनित रोगों और उनकी रोकथाम की जानकारी।",
    videoLessons: "वीडियो पाठ",
    videosSubtitle: "देखें और सीखें —",
    quickGuide: "त्वरित कार्रवाई मार्गदर्शिका",
    quickGuideSubtitle: "यदि आपके क्षेत्र में जल-जनित बीमारी का संदेह हो तो तुरंत ये कदम अपनाएँ।",
    preventionTips: "रोकथाम के सुझाव",
    preventionSubtitle: "संक्रामकता कम करने के आसान और व्यावहारिक कदम।",
    emergencyContacts: "आपातकालीन संपर्क",
    emergencySubtitle: "यदि लक्षण गंभीर हों, नीचे दिए गए नंबरों पर संपर्क करें या स्थानीय स्वास्थ्य केंद्र जाएँ।",
    resources: "डाउनलोड करने योग्य सामग्री",
    resourcesSubtitle: "पोस्टर, मार्गदर्शिका और पीडीएफ जिनका उपयोग समुदाय कर सकता है।",
    reportEmergency: "आपातकालीन रिपोर्ट करें",
    findClinic: "निकटतम क्लिनिक खोजें",
    noVideos: "कोई वीडियो उपलब्ध नहीं है",
    noVideosSub:
      "{topic} के लिए {lang} में वीडियो जल्द ही उपलब्ध होंगे। सामग्री देखने के लिए English चुनें।",
  },
  manipuri: {
    brand: "Nirogya",
    heroTitle: "জলজনিত ৰোগ সমূহ সন্দর্ভে জানক",
    heroSubtitle:
      "আপোনাৰ সমাজৰ লোকক হাজা আৰু আন জলজনিত ৰোগৰ পৰা ৰক্ষা কৰিবলৈ স্থানীয় ভাষাত সৰল শিক্ষামূলক সামগ্রী।",
    chooseLanguage: "আপোনাৰ ভাষা বাচক",
    languageSubtitle: "আপোনাৰ স্থানীয় ভাষাত ভিডিঅ' আৰু গাইড চাবৰ বাবে ভাষা বাচক।",
    diseaseCategories: "ৰোগৰ শ্ৰেণী",
    diseaseSubtitle: "সাধাৰণ জলজনিত ৰোগ আৰু ইয়াৰ প্ৰতিষেধক তথ্য।",
    videoLessons: "ভিডিঅ' পাঠ",
    videosSubtitle: "চাওক আৰু শিকক —",
    quickGuide: "দ্ৰুত কাৰ্যপদ্ধতি",
    quickGuideSubtitle:
      "আপোনাৰ অঞ্চলত জৰুৰী সন্দেহ হ'লে তৎক্ষণাত গ্ৰহণ কৰিবলগীয়া পদক্ষেপসমূহ।",
    preventionTips: "প্ৰতিৰোধৰ উপায়",
    preventionSubtitle: "সংক্রমণৰ আশংকা কমাবলৈ সহজ আৰু প্ৰায়োগিক উপায়সমূহ।",
    emergencyContacts: "জৰুৰী যোগাযোগ",
    emergencySubtitle:
      "লক্ষণৰ তীব্রতা থাকিলে তলত দিয়া নম্বৰসমূহত যোগাযোগ কৰক বা স্থানীয় স্বাস্থ্য কেন্দ্ৰলৈ যাওক।",
    resources: "ডাউনলোডযোগ্য সামগ্ৰী",
    resourcesSubtitle: "পোছ্টাৰ, গাইড আৰু কমিউনিটি ব্যৱহাৰৰ বাবে PDF।",
    reportEmergency: "জৰুৰী প্ৰতিবেদন",
    findClinic: "নিকটতম ক্লিনিক সন্ধান",
    noVideos: "ভিডিঅ' উপলব্ধ নহয়",
    noVideosSub:
      "{topic}ৰ বাবে {lang}ত ভিডিঅ' শীঘ্ৰে উপলব্ধ হ'ব। উপলব্ধ সামগ্ৰী চাবলৈ English বা অন্য ভাষা বাচক।",
  },
  khasi: {
    brand: "Nirogya",
    heroTitle: "Learn About Water-Borne Diseases",
    heroSubtitle:
      "Local-language resources to protect your community. (Please verify Khasi text with a native reviewer.)",
    chooseLanguage: "Choose Language",
    languageSubtitle: "Select a language to view content.",
    diseaseCategories: "Disease Categories",
    diseaseSubtitle: "Information on common water-borne illnesses.",
    videoLessons: "Video Lessons",
    videosSubtitle: "Watch and learn —",
    quickGuide: "Quick Action Guide",
    quickGuideSubtitle: "Immediate steps if an outbreak is suspected.",
    preventionTips: "Prevention Tips",
    preventionSubtitle: "Simple steps to reduce infection risk.",
    emergencyContacts: "Emergency Contacts",
    emergencySubtitle:
      "If symptoms are severe, contact the numbers below or visit your local clinic.",
    resources: "Downloadable Resources",
    resourcesSubtitle: "Posters and quick reference PDFs.",
    reportEmergency: "Report Emergency",
    findClinic: "Find Nearest Clinic",
    noVideos: "No Videos Available",
    noVideosSub:
      "Videos for {topic} in {lang} are coming soon. Try English or another language.",
  },
};

/* Data */
const languages: Language[] = [
  { code: "english", name: "English", native: "English" },
  { code: "hindi", name: "Hindi", native: "हिन्दी" },
  { code: "manipuri", name: "Manipuri", native: "মৈতৈলোন্" },
  { code: "khasi", name: "Khasi", native: "Khasi" },
];

const diseaseCategories: DiseaseCategory[] = [
  {
    id: "cholera",
    title: "Cholera",
    icon: "🦠",
    description: "Prevention, symptoms and immediate care for cholera.",
    videos: 5,
    resources: 8,
  },
  {
    id: "typhoid",
    title: "Typhoid",
    icon: "🤒",
    description: "Understanding typhoid fever and simple prevention steps.",
    videos: 4,
    resources: 6,
  },
  {
    id: "diarrhea",
    title: "Diarrheal Diseases",
    icon: "💊",
    description: "Home care and when to seek medical help.",
    videos: 6,
    resources: 10,
  },
  {
    id: "hepatitis",
    title: "Hepatitis A & E",
    icon: "🏥",
    description: "Water-borne hepatitis prevention and care.",
    videos: 3,
    resources: 5,
  },
];

/* Detailed Disease Information */
const diseaseDetailedInfo: { [key: string]: DiseaseInfo } = {
  cholera: {
    id: "cholera",
    title: "Cholera",
    symptoms: [
      "Sudden onset of watery diarrhea (often described as 'rice water' stools)",
      "Severe vomiting and nausea",
      "Extreme loss of body fluids and dehydration",
      "Weakness and muscle cramps",
      "Low blood pressure and weak pulse",
    ],
    prevention: [
      "Drink only boiled or purified water",
      "Wash hands frequently with soap and clean water",
      "Use clean utensils for eating and drinking",
      "Avoid raw or undercooked food",
      "Keep the environment and food storage clean",
    ],
    immediateAction: [
      "Start oral rehydration solution (ORS) immediately",
      "Mix ORS with safe drinking water in correct proportions",
      "Continue to feed the person (especially infants)",
      "Keep the person in a clean, hygienic place",
      "Monitor for signs of severe dehydration",
    ],
    whenToSeekHelp: [
      "Persistent watery diarrhea lasting more than 2 hours",
      "Signs of severe dehydration (sunken eyes, extreme weakness)",
      "Blood in stool or severe abdominal pain",
      "Persistent vomiting preventing fluid intake",
      "Rapid breathing or difficulty breathing",
    ],
    hometreatment: [
      "Administer ORS in small, frequent amounts",
      "Prepare homemade ORS if unavailable (6 tsp sugar + 1/2 tsp salt in 1L water)",
      "Keep the person warm and comfortable",
      "Maintain good hygiene to prevent spread",
      "Provide zinc supplementation if available",
    ],
  },
  typhoid: {
    id: "typhoid",
    title: "Typhoid Fever",
    symptoms: [
      "Sustained high fever (39-40°C) that develops gradually",
      "Headache and body aches",
      "Weakness and fatigue",
      "Abdominal pain and constipation (sometimes diarrhea)",
      "Rose spots (small pink rash) on trunk",
    ],
    prevention: [
      "Drink only boiled, filtered, or bottled water",
      "Avoid raw vegetables unless they can be peeled",
      "Avoid street food and unpasteurized milk",
      "Wash hands regularly with soap and clean water",
      "Get vaccinated if in high-risk areas",
    ],
    immediateAction: [
      "Rest and avoid strenuous activities",
      "Stay hydrated with safe drinking water",
      "Take paracetamol to reduce fever",
      "Keep the environment clean and hygienic",
      "Isolate the person to prevent transmission",
    ],
    whenToSeekHelp: [
      "High fever lasting more than 5-7 days",
      "Severe headache or abdominal pain",
      "Confusion or delirium",
      "Difficulty breathing or chest pain",
      "Severe diarrhea or bloody stools",
    ],
  },
  diarrhea: {
    id: "diarrhea",
    title: "Diarrheal Diseases",
    symptoms: [
      "Loose or watery stools more than 3 times daily",
      "Abdominal pain and cramping",
      "Nausea and vomiting",
      "Fever (in some cases)",
      "Signs of dehydration (dry mouth, dizziness)",
    ],
    prevention: [
      "Drink clean, boiled, or purified water",
      "Wash hands before eating and after using the toilet",
      "Keep food covered and stored properly",
      "Avoid raw or unwashed vegetables",
      "Use clean bathrooms and dispose waste properly",
    ],
    immediateAction: [
      "Start ORS therapy immediately to prevent dehydration",
      "Offer small amounts of safe fluids frequently",
      "Continue eating mild, nutritious food",
      "Avoid dairy and fatty foods temporarily",
      "Monitor stool frequency and consistency",
    ],
    whenToSeekHelp: [
      "Diarrhea lasting more than 2 weeks",
      "Bloody stools or severe abdominal pain",
      "Signs of severe dehydration",
      "High fever (above 39°C)",
      "Vomiting that prevents fluid intake",
    ],
    hometreatment: [
      "Continue breastfeeding if applicable",
      "Provide zinc supplementation (10-14 days)",
      "Offer soft, bland foods like rice, bananas",
      "Monitor hydration status closely",
      "Maintain hygiene to prevent complications",
    ],
  },
  hepatitis: {
    id: "hepatitis",
    title: "Hepatitis A & E",
    symptoms: [
      "Jaundice (yellowing of skin and eyes)",
      "Dark urine and pale stools",
      "Abdominal pain and discomfort",
      "Nausea, vomiting, and loss of appetite",
      "Fatigue and weakness",
    ],
    prevention: [
      "Drink only boiled or purified water",
      "Wash hands thoroughly with soap and water",
      "Avoid eating food prepared in unhygienic conditions",
      "Get vaccinated against Hepatitis A",
      "Practice proper sanitation and hygiene",
    ],
    immediateAction: [
      "Rest and avoid strenuous activities",
      "Increase fluid intake to prevent dehydration",
      "Avoid alcohol and fatty foods",
      "Take paracetamol for pain/fever as needed",
      "Maintain strict personal hygiene",
    ],
    whenToSeekHelp: [
      "Jaundice that develops suddenly",
      "Severe abdominal pain or vomiting",
      "Very dark urine or pale stools",
      "Fever lasting more than a week",
      "Confusion or behavioral changes",
    ],
  },
};

const allVideos: { [key: string]: { [key: string]: Video[] } } = {
  cholera: {
    english: [
      {
        id: "ch-en-1",
        title: "Understanding Cholera: Symptoms and Early Warning Signs",
        description:
          "Learn to identify cholera symptoms early and take immediate action.",
        duration: "8:45",
        views: "12.5K",
        language: "english",
        embedUrl: "https://www.youtube.com/embed/cvMN_YjDiCI?si=MAcGaDmP9YHIiWkI",
      },
      {
        id: "ch-en-2",
        title: "Safe Water Practices: Boiling and Purification",
        description: "Step-by-step guide to boiling and purifying water.",
        duration: "6:30",
        views: "18.2K",
        language: "english",
        embedUrl: "https://www.youtube.com/embed/ayu1ykggouk?si=AnY0ODAEbK6vilpS",
      },
    ],
    hindi: [
      {
        id: "ch-hi-1",
        title: "हैजा को समझें: लक्षण और चेतावनी",
        description: "हैजा के लक्षणों को पहचानें और तुरंत कार्रवाई करें।",
        duration: "8:45",
        views: "15.2K",
        language: "hindi",
        embedUrl: "https://www.youtube.com/embed/j0bJ5xftmNU?si=ztSqCzWQ3w5ysNhu",
      },
    ],
    manipuri: [
      {
        id: "ch-mi-1",
        title: "হাইজা: লক্ষণ আৰু পদক্ষেপ",
        description: "হাইজাৰ লক্ষণ চিনাক্ত কৰা আৰু প্ৰাথমিক ব্যৱস্থা গ্ৰহণ কৰা।",
        duration: "8:30",
        views: "3.4K",
        language: "manipuri",
        embedUrl: "",
      },
    ],
    khasi: [],
  },
  typhoid: {
    english: [
      {
        id: "ty-en-1",
        title: "Typhoid Fever: Prevention and Treatment",
        description: "Complete guide to understanding typhoid fever.",
        duration: "7:20",
        views: "10.5K",
        language: "english",
        embedUrl: "https://www.youtube.com/embed/XkZTS8ep5wQ?si=6-xQd6wTkaV_77fd",
      },
    ],
    hindi: [
      {
        id: "ty-hi-1",
        title: "टाइफाइड बुखार: रोकथाम और उपचार",
        description: "टाइफाइड से कैसे बचें और उपचार क्या है।",
        duration: "8:45",
        views: "8.1K",
        language: "hindi",
        embedUrl: "https://www.youtube.com/embed/1HUzyW6vcwQ?si=RMYd1smIwI24jNgT",
      },
    ],
  },
  diarrhea: {
    english: [
      {
        id: "di-en-1",
        title: "Managing Diarrheal Diseases at Home",
        description: "How to manage diarrheal illness and when to seek help.",
        duration: "6:15",
        views: "14.8K",
        language: "english",
        embedUrl: "https://www.youtube.com/embed/uAmSbAoMr7Y?si=--REmRgZrtXwTE5s",
      },
    ],
    hindi: [
      {
        id: "di-hi-1",
        title: "घर पर दस्त का प्रबंधन",
        description: "जानें कि कब चिकित्सा सहायता लें।",
        duration: "8:45",
        views: "15.2K",
        language: "hindi",
        embedUrl: "https://www.youtube.com/embed/x5n2RzvwWpw?si=dzBIuGoeoSQZAObp",
      },
    ],
  },
  hepatitis: {
    english: [
      {
        id: "he-en-1",
        title: "Hepatitis A & E: Water-Borne Prevention",
        description: "Understanding water-borne hepatitis and prevention steps.",
        duration: "9:10",
        views: "7.2K",
        language: "english",
        embedUrl: "https://www.youtube.com/embed/hTKVB4v5Gg8?si=7laEyaEXHBhigZ8Z",
      },
    ],
    hindi: [
      {
        id: "he-hi-1",
        title: "हेपेटाइटिस ए एवं ई: रोकथाम",
        description: "जलजनित हेपेटाइटिस से कैसे बचें।",
        duration: "8:45",
        views: "4.2K",
        language: "hindi",
        embedUrl: "https://www.youtube.com/embed/l-wMisFSuek?si=3eGeKAurZJI2kb_I",
      },
    ],
  },
};

function t(lang: LanguageCode, key: string, replacements?: Record<string, string>) {
  const text = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS["english"][key] ?? key;
  if (!replacements) return text;
  return Object.entries(replacements).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, v),
    text
  );
}

const FILTERS = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
  "active",
  "monitoring",
  "resolved",
] as const;

const Education: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>("english");
  const [selectedCategory, setSelectedCategory] = useState<string>("cholera");
  const [isDiseaseModalVisible, setIsDiseaseModalVisible] = useState(false);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>("cholera");

  const getFilteredVideos = (): Video[] => {
    const cat = allVideos[selectedCategory] || {};
    const languageVideos = (cat[selectedLanguage as string] || []) as Video[];
    if (!languageVideos || languageVideos.length === 0) {
      return (cat["english"] || []) as Video[];
    }
    return languageVideos;
  };

  const handleDiseaseCardClick = (diseaseId: string) => {
    setSelectedDiseaseId(diseaseId);
    setIsDiseaseModalVisible(true);
  };

  const videos = getFilteredVideos();
  const currentDiseaseInfo = diseaseDetailedInfo[selectedDiseaseId];

  return (
    <div className="education-page">
      {/* Hero */}
      <section className="education-hero">
        <div className="hero-inner">
          <div className="hero-top">
            <div className="brand">
              <SafetyOutlined /> {t(selectedLanguage, "brand")}
            </div>
            <div className="hero-icons">
              <TeamOutlined />
              <GlobalOutlined />
            </div>
          </div>

          <div className="hero-center">
            <Title level={1} className="hero-title">
              {t(selectedLanguage, "heroTitle")}
            </Title>
            <Paragraph className="hero-subtitle">
              {t(selectedLanguage, "heroSubtitle")}
            </Paragraph>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">15+</span>
                <span className="stat-label">{t(selectedLanguage, "videoLessons")}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">3</span>
                <span className="stat-label">{t(selectedLanguage, "chooseLanguage")}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Lives Protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Language Selection */}
      <section className="language-section">
        <div className="container">
          <Title level={2} className="section-title">
            {t(selectedLanguage, "chooseLanguage")}
          </Title>
          <Paragraph className="section-subtitle">
            {t(selectedLanguage, "languageSubtitle")}
          </Paragraph>

          <div className="language-grid">
            {languages.map((lang) => (
              <div
                key={lang.code}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedLanguage(lang.code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedLanguage(lang.code);
                }}
                className={`language-card ${
                  selectedLanguage === lang.code ? "active" : ""
                }`}
                aria-pressed={selectedLanguage === lang.code}
              >
                <div className="language-name">{lang.name}</div>
                <div className="language-native">{lang.native}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <Title level={2} className="section-title">
            {t(selectedLanguage, "diseaseCategories")}
          </Title>
          <Paragraph className="section-subtitle">
            {t(selectedLanguage, "diseaseSubtitle")}
          </Paragraph>
          <div className="categories-grid">
            {diseaseCategories.map((cat) => (
              <div
                key={cat.id}
                className={`category-card ${
                  selectedCategory === cat.id ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  handleDiseaseCardClick(cat.id);
                }}
              >
                <div className="category-icon">
                  <MedicineBoxOutlined />
                </div>

                <div className="category-title">{cat.title}</div>
                <div className="category-description">{cat.description}</div>

                <div className="category-meta">
                  <span>{cat.videos} Videos</span> •{" "}
                  <span>{cat.resources} Resources</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Quick Guide */}
      <section className="quick-guide-section">
        <div className="container">
          <Title level={2} className="section-title">
            {t(selectedLanguage, "quickGuide")}
          </Title>

          <Paragraph className="section-subtitle">
            {t(selectedLanguage, "quickGuideSubtitle")}
          </Paragraph>

          <div className="quick-grid">
            <div className="quick-card">
              <ThunderboltOutlined className="quick-icon" />
              <div className="quick-title">Immediate Response</div>
              <Paragraph>
                Identify symptoms early and take action within the first **6
                hours**.
              </Paragraph>
            </div>

            <div className="quick-card">
              <SafetyOutlined className="quick-icon" />
              <div className="quick-title">Safe Water Protocol</div>
              <Paragraph>
                Always boil or purify water before drinking during outbreaks.
              </Paragraph>
            </div>

            <div className="quick-card">
              <MedicineBoxOutlined className="quick-icon" />
              <div className="quick-title">ORS & Hydration</div>
              <Paragraph>
                Use ORS immediately if diarrhea symptoms begin.
              </Paragraph>
            </div>
          </div>
        </div>
      </section>

      {/* Prevention */}
      <section className="prevention-section">
        <div className="container">
          <Title level={2} className="section-title">
            {t(selectedLanguage, "preventionTips")}
          </Title>
          <Paragraph className="section-subtitle">
            {t(selectedLanguage, "preventionSubtitle")}
          </Paragraph>

          <div className="prevention-grid">
            <div className="prevention-card">
              <SafetyOutlined />
              <div className="prevention-title">Clean Drinking Water</div>
              <Paragraph>Boil water for at least 1 minute.</Paragraph>
            </div>

            <div className="prevention-card">
              <EyeOutlined />
              <div className="prevention-title">Hand Hygiene</div>
              <Paragraph>Wash hands before eating and after using the toilet.</Paragraph>
            </div>

            <div className="prevention-card">
              <MedicineBoxOutlined />
              <div className="prevention-title">Food Safety</div>
              <Paragraph>Avoid raw foods during outbreaks.</Paragraph>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="resources-section">
        <div className="container">
          <Title level={2} className="section-title">
            {t(selectedLanguage, "resources")}
          </Title>
          <Paragraph className="section-subtitle">
            {t(selectedLanguage, "resourcesSubtitle")}
          </Paragraph>

          <div className="resource-grid">
            <div className="resource-card">
              <FileTextOutlined className="resource-icon" />
              <div className="resource-title">Community Posters</div>
              <Button type="primary" icon={<DownloadOutlined />}>
                Download
              </Button>
            </div>

            <div className="resource-card">
              <SafetyOutlined className="resource-icon" />
              <div className="resource-title">Water Safety Guide</div>
              <Button type="primary" icon={<DownloadOutlined />}>
                Download
              </Button>
            </div>

            <div className="resource-card">
              <TeamOutlined className="resource-icon" />
              <div className="resource-title">Awareness Materials</div>
              <Button type="primary" icon={<DownloadOutlined />}>
                Download
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency */}
      <section className="emergency-section">
        <div className="container emergency-box">
          <PhoneOutlined className="emergency-icon" />
          <Title level={3} className="emergency-title">
            {t(selectedLanguage, "reportEmergency")}
          </Title>

          <Paragraph>
            If someone shows symptoms of severe dehydration, blood in stool, or
            vomiting — get medical help immediately.
          </Paragraph>

          <div className="emergency-buttons">
            <Button type="primary" size="large" icon={<PhoneOutlined />}>
              Contact Local Health Worker
            </Button>

            <Button size="large" icon={<MedicineBoxOutlined />}>
              {t(selectedLanguage, "findClinic")}
            </Button>
          </div>
        </div>
      </section>

      {/* Disease Information Modal */}
      <Modal
        title={
          <div className="disease-modal-title">
            <span className="disease-modal-icon">
              {diseaseCategories.find((d) => d.id === selectedDiseaseId)?.icon}
            </span>
            <span>{currentDiseaseInfo?.title}</span>
          </div>
        }
        open={isDiseaseModalVisible}
        onCancel={() => setIsDiseaseModalVisible(false)}
        width={900}
        centered
        className="disease-info-modal"
        footer={[
          <Button key="close" type="primary" onClick={() => setIsDiseaseModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {currentDiseaseInfo && (
          <div className="disease-modal-content">
            {/* Symptoms */}
            <div className="disease-section">
              <Title level={4} className="disease-section-title">
                <AlertOutlined /> Symptoms to Watch For
              </Title>
              <List
                dataSource={currentDiseaseInfo.symptoms}
                renderItem={(item) => (
                  <List.Item className="disease-list-item">
                    <CheckCircleOutlined className="disease-icon-small" />
                    <span>{item}</span>
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            {/* Prevention */}
            <div className="disease-section">
              <Title level={4} className="disease-section-title">
                <SafetyOutlined /> Prevention Steps
              </Title>
              <List
                dataSource={currentDiseaseInfo.prevention}
                renderItem={(item) => (
                  <List.Item className="disease-list-item">
                    <CheckCircleOutlined className="disease-icon-small" />
                    <span>{item}</span>
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            {/* Immediate Action */}
            <div className="disease-section">
              <Title level={4} className="disease-section-title">
                <ThunderboltOutlined /> Immediate Action
              </Title>
              <List
                dataSource={currentDiseaseInfo.immediateAction}
                renderItem={(item) => (
                  <List.Item className="disease-list-item">
                    <CheckCircleOutlined className="disease-icon-small" />
                    <span>{item}</span>
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            {/* When to Seek Help */}
            <div className="disease-section">
              <Title level={4} className="disease-section-title">
                <HeartOutlined /> When to Seek Medical Help
              </Title>
              <List
                dataSource={currentDiseaseInfo.whenToSeekHelp}
                renderItem={(item) => (
                  <List.Item className="disease-list-item">
                    <AlertOutlined className="disease-icon-warning" />
                    <span>{item}</span>
                  </List.Item>
                )}
              />
            </div>

            {/* Home Treatment */}
            {currentDiseaseInfo.hometreatment && (
              <>
                <Divider />
                <div className="disease-section">
                  <Title level={4} className="disease-section-title">
                    <MedicineBoxOutlined /> Home Treatment
                  </Title>
                  <List
                    dataSource={currentDiseaseInfo.hometreatment}
                    renderItem={(item) => (
                      <List.Item className="disease-list-item">
                        <CheckCircleOutlined className="disease-icon-small" />
                        <span>{item}</span>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}

            {/* Educational Videos */}
            <Divider style={{ margin: "28px 0 24px" }} />
            <div className="disease-section">
              <Title level={4} className="disease-section-title">
                <PlayCircleOutlined /> Learn More: Video Resources
              </Title>
              <div className="disease-videos-grid">
                {allVideos[selectedDiseaseId]?.[selectedLanguage as string]?.map(
                  (video: Video) => (
                    <div key={video.id} className="disease-video-card">
                      <div className="disease-video-wrapper">
                        {video.embedUrl ? (
                          <iframe
                            src={video.embedUrl}
                            title={video.title}
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="disease-video-coming-soon">
                            <ClockCircleOutlined />
                            <span>Coming Soon</span>
                          </div>
                        )}
                      </div>
                      <div className="disease-video-info">
                        <div className="disease-video-title">{video.title}</div>
                        <div className="disease-video-meta">
                          <span>{video.duration}</span> • <span>{video.views} views</span>
                        </div>
                      </div>
                    </div>
                  )
                ) ||
                  (allVideos[selectedDiseaseId]?.["english"]?.map(
                    (video: Video) => (
                      <div key={video.id} className="disease-video-card">
                        <div className="disease-video-wrapper">
                          {video.embedUrl ? (
                            <iframe
                              src={video.embedUrl}
                              title={video.title}
                              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="disease-video-coming-soon">
                              <ClockCircleOutlined />
                              <span>Coming Soon</span>
                            </div>
                          )}
                        </div>
                        <div className="disease-video-info">
                          <div className="disease-video-title">{video.title}</div>
                          <div className="disease-video-meta">
                            <span>{video.duration}</span> • <span>{video.views} views</span>
                          </div>
                        </div>
                      </div>
                    )
                  ) || [])}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Education;