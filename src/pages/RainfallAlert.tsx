import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudRain,
  AlertTriangle,
  Droplets,
  Wind,
  ThermometerSun,
  Navigation,
  Calendar,
  Clock,
  Info,
  Mountain,
  Waves,
  RefreshCw
} from 'lucide-react';

interface Region {
  name: string;
  state: string;
  elevation: string;
  coordinates: string;
  lat: number;
  lon: number;
}

interface Regions {
  shillong: Region;
  cherrapunji: Region;
  mawsynram: Region;
}

type RegionKey = keyof Regions;

interface Alert {
  level: 'high' | 'medium' | 'low';
  title: string;
  region: string;
  description: string;
  validUntil: string;
  rainfall: string;
}

interface ForecastDay {
  day: string;
  temp: string;
  condition: string;
  rainfall: string;
  humidity: string;
  wind: string;
  icon: string;
}

interface InstructionSection {
  category: string;
  icon: React.ReactNode;
  items: string[];
}

const RainfallAlerts: React.FC = () => {
  // ⚠️ REPLACE THIS WITH YOUR OPENWEATHERMAP API KEY
  const API_KEY = '086ee6d9226f5daaf8852c71265ed342';
  
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('shillong');
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const regions: Regions = {
    shillong: {
      name: 'Shillong',
      state: 'Meghalaya',
      elevation: '1496m',
      coordinates: '25.57°N, 91.88°E',
      lat: 25.57,
      lon: 91.88
    },
    cherrapunji: {
      name: 'Cherrapunji',
      state: 'Meghalaya',
      elevation: '1484m',
      coordinates: '25.30°N, 91.70°E',
      lat: 25.30,
      lon: 91.70
    },
    mawsynram: {
      name: 'Mawsynram',
      state: 'Meghalaya',
      elevation: '1400m',
      coordinates: '25.30°N, 91.58°E',
      lat: 25.30,
      lon: 91.58
    }
  };

  // IMD District IDs for Meghalaya regions
  const districtIds: Record<RegionKey, number> = {
    shillong: 164, // East Khasi Hills
    cherrapunji: 164, // East Khasi Hills
    mawsynram: 164 // East Khasi Hills
  };

  const fetchWeatherData = async (region: Region) => {
    if (!API_KEY || API_KEY.trim() === '' || API_KEY.trim() === 'YOUR_API_KEY_HERE') {
      setError('Please add your OpenWeatherMap API key in the code');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. OpenWeather Forecast (existing free API)
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${region.lat}&lon=${region.lon}&units=metric&appid=${API_KEY}`
      );

      if (!weatherResponse.ok) {
        throw new Error('Weather forecast unavailable');
      }

      const weatherData = await weatherResponse.json();
      
      // Process forecast data (unchanged)
      const dailyForecasts: ForecastDay[] = [];
      const processedDates = new Set<string>();

      weatherData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toDateString();
        
        if (!processedDates.has(dateStr) && dailyForecasts.length < 5) {
          processedDates.add(dateStr);
          
          const dayName = dailyForecasts.length === 0 ? 'Today' : 
                         dailyForecasts.length === 1 ? 'Tomorrow' : 
                         `Day ${dailyForecasts.length + 1}`;

          const rain = item.rain?.['3h'] || 0;
          const rainfall = Math.round(rain * 8);

          dailyForecasts.push({
            day: dayName,
            temp: `${Math.round(item.main.temp)}°C`,
            condition: item.weather[0].main,
            rainfall: `${rainfall}mm`,
            humidity: `${item.main.humidity}%`,
            wind: `${Math.round(item.wind.speed * 3.6)} km/h`,
            icon: item.weather[0].icon
          });
        }
      });

      // 2. IMD Meghalaya State Rainfall (FREE)
      const imdStateResponse = await fetch(
        'https://mausam.imd.gov.in/api/statewise_rainfall_api.php?id=meghalaya'
      );

      let dynamicAlerts: Alert[] = [];

      if (imdStateResponse.ok) {
        const imdStateData = await imdStateResponse.json();
        dynamicAlerts = processIMDStateAlerts(imdStateData);
      }

      // 3. IMD District Warnings (FREE)
      const districtId = districtIds[selectedRegion as RegionKey];
      const imdDistrictResponse = await fetch(
        `https://mausam.imd.gov.in/api/warnings_district_api.php?id=${districtId}`
      );

      if (imdDistrictResponse.ok) {
        const imdDistrictData = await imdDistrictResponse.json();
        const districtAlerts = processIMDDistrictAlerts(imdDistrictData, region);
        dynamicAlerts = [...dynamicAlerts, ...districtAlerts].slice(0, 3);
      }

      // Use dynamic alerts or fallback
      const finalAlerts = dynamicAlerts.length > 0 ? dynamicAlerts : fallbackAlerts;
      
      setForecast(dailyForecasts);
      setAlerts(finalAlerts);
      setLastUpdate(new Date());
      setLoading(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setLoading(false);
      
      // Fallback data
      setForecast([
        { day: 'Today', temp: '18°C', condition: 'Heavy Rain', rainfall: '85mm', humidity: '95%', wind: '25 km/h', icon: '10d' },
        { day: 'Tomorrow', temp: '19°C', condition: 'Moderate Rain', rainfall: '45mm', humidity: '92%', wind: '20 km/h', icon: '09d' },
        { day: 'Day 3', temp: '20°C', condition: 'Light Rain', rainfall: '25mm', humidity: '88%', wind: '15 km/h', icon: '09d' },
        { day: 'Day 4', temp: '21°C', condition: 'Cloudy', rainfall: '10mm', humidity: '80%', wind: '12 km/h', icon: '03d' },
        { day: 'Day 5', temp: '22°C', condition: 'Partly Cloudy', rainfall: '5mm', humidity: '75%', wind: '10 km/h', icon: '02d' }
      ]);
      setAlerts(fallbackAlerts);
    }
  };

  // Process IMD State Rainfall Data
  const processIMDStateAlerts = (imdData: any[]): Alert[] => {
    const newAlerts: Alert[] = [];
    
    imdData.forEach((district: any) => {
      const dailyRain = parseFloat(district['Daily Actl'] || '0');
      const monthlyCat = district['Monthly Category'] || '';
      
      if (dailyRain > 50 || monthlyCat === 'LE') {
        newAlerts.push({
          level: dailyRain > 100 ? 'high' : 'medium',
          title: `${district.District} Heavy Rainfall`,
          region: district.District,
          description: `Recorded ${dailyRain.toFixed(1)}mm rainfall today`,
          validUntil: '24 hours',
          rainfall: `${dailyRain.toFixed(1)}mm observed`
        });
      }
    });

    return newAlerts.slice(0, 2);
  };

  // Process IMD District Warnings
  const processIMDDistrictAlerts = (districtData: any[], region: Region): Alert[] => {
    const newAlerts: Alert[] = [];
    
    districtData.forEach((warning: any) => {
      const warningCode = warning['Warning_Code'];
      let level: Alert['level'] = 'low';
      let title = 'Weather Advisory';
      let rainfall = '20-50mm';
      let description = warning.Description || 'Be cautious of severe weather';

      switch (warningCode) {
        case '2':
          level = 'high';
          title = 'Heavy Rainfall Warning';
          rainfall = '64.5mm+';
          break;
        case '4':
          level = 'medium';
          title = 'Thunderstorm Alert';
          rainfall = '30-64mm';
          break;
        case '1':
          level = 'low';
          title = 'General Advisory';
          rainfall = '10-30mm';
          break;
      }

      newAlerts.push({
        level,
        title,
        region: region.name,
        description: description.substring(0, 120) + '...',
        validUntil: 'Next 24 hours',
        rainfall
      });
    });

    return newAlerts;
  };

  useEffect(() => {
    fetchWeatherData(regions[selectedRegion]);
  }, [selectedRegion]);

  const handleRefresh = () => {
    fetchWeatherData(regions[selectedRegion]);
  };

  // Fallback static alerts (used when APIs fail)
  const fallbackAlerts: Alert[] = [
    {
      level: 'high',
      title: 'Heavy Rainfall Warning',
      region: 'East Khasi Hills',
      description: 'Heavy to very heavy rainfall expected in the next 24-48 hours',
      validUntil: '48 hours',
      rainfall: '150-200mm'
    },
    {
      level: 'medium',
      title: 'Landslide Risk Advisory',
      region: 'Shillong-Guwahati Highway',
      description: 'Increased landslide risk due to continuous rainfall',
      validUntil: '72 hours',
      rainfall: '80-120mm'
    },
    {
      level: 'low',
      title: 'Flash Flood Watch',
      region: 'Low-lying Areas',
      description: 'Possibility of flash floods in valley regions',
      validUntil: '24 hours',
      rainfall: '50-80mm'
    }
  ];

  const instructions: InstructionSection[] = [
    {
      category: 'Before Rainfall',
      icon: <Cloud style={{ width: '20px', height: '20px' }} />,
      items: [
        'Check weather updates regularly through official sources',
        'Inspect drainage systems around your home',
        'Secure loose objects that could be blown away',
        'Stock emergency supplies (food, water, medicines, flashlight)',
        'Keep important documents in waterproof containers'
      ]
    },
    {
      category: 'During Heavy Rainfall',
      icon: <CloudRain style={{ width: '20px', height: '20px' }} />,
      items: [
        'Avoid traveling on hilly roads and highways',
        'Stay away from landslide-prone areas',
        'Do not cross flooded streams or rivers',
        'Keep away from electric poles and fallen wires',
        'Monitor local news for evacuation orders'
      ]
    },
    {
      category: 'Landslide Safety',
      icon: <Mountain style={{ width: '20px', height: '20px' }} />,
      items: [
        'Watch for signs: cracks in walls, tilting trees, sudden water flow changes',
        'Move immediately if you hear rumbling sounds from hillside',
        'Evacuate to higher ground if in valley areas',
        'Alert authorities if you notice landslide warning signs',
        'Avoid construction near steep slopes during monsoon'
      ]
    },
    {
      category: 'Flash Flood Precautions',
      icon: <Waves style={{ width: '20px', height: '20px' }} />,
      items: [
        'Move to higher ground immediately if water starts rising',
        'Never walk or drive through flowing water',
        'Stay informed about water levels in nearby streams',
        'Keep emergency contact numbers readily available',
        'Have an evacuation plan and practice it with family'
      ]
    }
  ];

  const getConditionIcon = (condition: string, iconCode?: string): React.ReactNode => {
    if (iconCode) {
      return <img 
        src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
        alt={condition}
        style={{ width: '60px', height: '60px' }}
      />;
    }
    
    if (condition.includes('Heavy') || condition.includes('Rain')) return <CloudRain style={{ width: '40px', height: '40px' }} />;
    if (condition.includes('Cloud')) return <Cloud style={{ width: '40px', height: '40px' }} />;
    return <Cloud style={{ width: '40px', height: '40px' }} />;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '15px', 
          padding: '25px',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Mountain style={{ width: '40px', height: '40px', color: '#667eea' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', color: '#1a202c' }}>Rainfall Alerts & Forecast</h1>
                <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>Hilly Region Weather Monitoring System</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <Clock style={{ width: '16px', height: '16px', color: '#667eea' }} />
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>{currentTime.toLocaleTimeString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar style={{ width: '16px', height: '16px', color: '#667eea' }} />
                  <span style={{ fontSize: '14px', color: '#718096' }}>{currentTime.toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Refresh
              </button>
            </div>
          </div>

          {/* Region Selector */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {(Object.entries(regions) as [RegionKey, Region][]).map(([key, region]) => (
              <button
                key={key}
                onClick={() => setSelectedRegion(key)}
                style={{
                  flex: 1,
                  padding: '15px',
                  border: selectedRegion === key ? '2px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: '10px',
                  background: selectedRegion === key ? '#f0f4ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c' }}>{region.name}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '5px' }}>{region.elevation}</div>
              </button>
            ))}
          </div>

          {/* Current Location Info */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            padding: '15px',
            background: '#f7fafc',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation style={{ width: '16px', height: '16px', color: '#667eea' }} />
              <span style={{ fontSize: '14px' }}>{regions[selectedRegion].coordinates}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mountain style={{ width: '16px', height: '16px', color: '#667eea' }} />
              <span style={{ fontSize: '14px' }}>Elevation: {regions[selectedRegion].elevation}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info style={{ width: '16px', height: '16px', color: '#667eea' }} />
              <span style={{ fontSize: '14px' }}>{regions[selectedRegion].state}</span>
            </div>
          </div>

          {error && (
            <div style={{ 
              marginTop: '15px',
              padding: '12px',
              background: '#fee',
              borderLeft: '4px solid #e53e3e',
              borderRadius: '4px',
              color: '#c53030',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {lastUpdate && !error && (
            <div style={{ 
              marginTop: '10px',
              fontSize: '12px',
              color: '#718096',
              textAlign: 'right'
            }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Active Alerts */}
            <div style={{ 
              background: 'white', 
              borderRadius: '15px', 
              padding: '25px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '20px',
                color: '#1a202c'
              }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#667eea' }} />
                Active Alerts
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {alerts.map((alert, idx) => (
                  <div key={idx} style={{ 
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '15px',
                    borderLeft: `4px solid ${alert.level === 'high' ? '#e53e3e' : alert.level === 'medium' ? '#ed8936' : '#48bb78'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#1a202c' }}>{alert.title}</h3>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: alert.level === 'high' ? '#fee' : alert.level === 'medium' ? '#fef5e7' : '#e6ffed',
                        color: alert.level === 'high' ? '#c53030' : alert.level === 'medium' ? '#c05621' : '#22543d'
                      }}>
                        {alert.level.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#667eea', fontWeight: '600' }}>{alert.region}</p>
                    <p style={{ margin: '10px 0', fontSize: '14px', color: '#4a5568' }}>{alert.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#718096', marginTop: '10px' }}>
                      <span>Expected: {alert.rainfall}</span>
                      <span>Valid: {alert.validUntil}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Instructions */}
            <div style={{ 
              background: 'white', 
              borderRadius: '15px', 
              padding: '25px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '20px',
                color: '#1a202c'
              }}>
                <Info style={{ width: '24px', height: '24px', color: '#667eea' }} />
                Safety Instructions for Hilly Areas
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {instructions.map((section, idx) => (
                  <div key={idx} style={{ 
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '15px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                      <div style={{ 
                        background: '#f0f4ff',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#667eea'
                      }}>
                        {section.icon}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>{section.category}</h3>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} style={{ 
                          display: 'flex',
                          gap: '8px',
                          marginBottom: '10px',
                          fontSize: '13px',
                          color: '#4a5568',
                          lineHeight: '1.5'
                        }}>
                          <span style={{ 
                            color: '#667eea',
                            fontWeight: 'bold',
                            minWidth: '8px'
                          }}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 5-Day Forecast */}
            <div style={{ 
              background: 'white', 
              borderRadius: '15px', 
              padding: '25px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '20px',
                color: '#1a202c'
              }}>
                <CloudRain style={{ width: '24px', height: '24px', color: '#667eea' }} />
                5-Day Weather Forecast
              </h2>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                  <RefreshCw style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                  <p>Loading weather data...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {forecast.map((day, idx) => (
                    <div key={idx} style={{ 
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '15px',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: '15px',
                      alignItems: 'center'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>{day.day}</p>
                        {getConditionIcon(day.condition, day.icon)}
                        <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>{day.temp}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#718096' }}>{day.condition}</p>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4a5568' }}>
                            <Droplets style={{ width: '16px', height: '16px', color: '#667eea' }} />
                            <span>Rainfall</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#3182ce' }}>{day.rainfall}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4a5568' }}>
                            <ThermometerSun style={{ width: '16px', height: '16px', color: '#667eea' }} />
                            <span>Humidity</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{day.humidity}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4a5568' }}>
                            <Wind style={{ width: '16px', height: '16px', color: '#667eea' }} />
                            <span>Wind</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>{day.wind}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            <div style={{ 
              background: 'white', 
              borderRadius: '15px', 
              padding: '25px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '18px',
                color: '#1a202c'
              }}>
                <AlertTriangle style={{ width: '22px', height: '22px', color: '#e53e3e' }} />
                Emergency Contacts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ 
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: '8px',
                  borderLeft: '3px solid #e53e3e'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#718096' }}>Emergency Services</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a202c' }}>📞 Dial 112</p>
                </div>
                <div style={{ 
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: '8px',
                  borderLeft: '3px solid #ed8936'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#718096' }}>State Disaster Management</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a202c' }}>📞 0364-2226059</p>
                </div>
                <div style={{ 
                  padding: '12px',
                  background: '#f7fafc',
                  borderRadius: '8px',
                  borderLeft: '3px solid #3182ce'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#718096' }}>Weather Information</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a202c' }}>📞 IMD: 1800-180-1717</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RainfallAlerts;
