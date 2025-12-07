import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, CheckSquare, Square } from 'lucide-react';
import './AshaWorker.css';

interface FormData {
  fullName: string;
  age: string;
  email: string;
  phone: string;
  address: string;
  education: string;
  experience: string;
  testDate: string;
  testTime: string;
}

interface FormErrors {
  fullName?: string;
  age?: string;
  email?: string;
  phone?: string;
  address?: string;
  education?: string;
  testDate?: string;
  testTime?: string;
  [key: string]: string | undefined;
}

interface CriteriaChecked {
  resident: boolean;
  ageRange: boolean;
  education: boolean;
  literacy: boolean;
  maritalStatus: boolean;
  communication: boolean;
  willing: boolean;
}

const AshaWorker = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    email: '',
    phone: '',
    address: '',
    education: '',
    experience: '',
    testDate: '',
    testTime: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [criteriaChecked, setCriteriaChecked] = useState<CriteriaChecked>({
    resident: false,
    ageRange: false,
    education: false,
    literacy: false,
    maritalStatus: false,
    communication: false,
    willing: false
  });

  const criteria = [
    { id: 'resident', text: 'I am a woman resident of the village' },
    { id: 'ageRange', text: 'I am between 25-45 years of age' },
    { id: 'education', text: 'I have completed minimum 8th standard' },
    { id: 'literacy', text: 'I am able to read and write' },
    { id: 'maritalStatus', text: 'I am married/widow/divorced' },
    { id: 'communication', text: 'I have good communication and interpersonal skills' },
    { id: 'willing', text: 'I am willing to work in the community' }
  ];

  const allCriteriaChecked = Object.values(criteriaChecked).every(value => value === true);

  const handleCriteriaChange = (id: keyof CriteriaChecked) => {
    setCriteriaChecked(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleProceedToForm = () => {
    if (allCriteriaChecked) {
      setShowForm(true);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    const age = parseInt(formData.age);
    if (!formData.age || age < 25 || age > 45) {
      newErrors.age = 'Age must be between 25 and 45 years';
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.phone.match(/^[0-9]{10}$/)) {
      newErrors.phone = 'Valid 10-digit phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.education) {
      newErrors.education = 'Education qualification is required';
    }

    if (!formData.testDate) {
      newErrors.testDate = 'Test date is required';
    }

    if (!formData.testTime) {
      newErrors.testTime = 'Test time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);
      console.log('Application submitted:', formData);
      
      setTimeout(() => {
        setSubmitted(true);
        setLoading(false);
        
        setTimeout(() => {
          setFormData({
            fullName: '',
            age: '',
            email: '',
            phone: '',
            address: '',
            education: '',
            experience: '',
            testDate: '',
            testTime: ''
          });
          setSubmitted(false);
          setShowForm(false);
          setCriteriaChecked({
            resident: false,
            ageRange: false,
            education: false,
            literacy: false,
            maritalStatus: false,
            communication: false,
            willing: false
          });
        }, 3000);
      }, 1000);
    }
  };

  if (submitted) {
    return (
      <div className="asha-worker-page">
        <div className="success-section">
          <div className="container">
            <div className="success-card">
              <CheckCircle className="success-icon" />
              <h2 className="success-title">Application Submitted!</h2>
              <p className="success-message">
                Your application has been received. You will receive a confirmation email shortly with your test details.
              </p>
              <div className="success-details">
                <p><strong>Test Date:</strong> {formData.testDate}</p>
                <p><strong>Test Time:</strong> {formData.testTime}</p>
                <p>Please arrive 15 minutes early with a valid ID proof.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="asha-worker-page">
      <div className="asha-worker-hero">
        <div className="hero-content">
          <h1 className="hero-title">ASHA Worker Application</h1>
          <p className="hero-subtitle">Accredited Social Health Activist Program</p>
        </div>
      </div>

      {!showForm ? (
        <div className="eligibility-section">
          <div className="container">
            <div className="criteria-section">
              <h2><AlertCircle className="w-5 h-5" />Eligibility Criteria - Please Confirm</h2>
              <p className="section-description">
                Please tick all the boxes below to confirm that you meet the eligibility criteria for becoming an ASHA worker.
              </p>
              <div>
                {criteria.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleCriteriaChange(item.id as keyof CriteriaChecked)}
                    className="criteria-item"
                  >
                    <div className="criteria-checkbox">
                      {criteriaChecked[item.id as keyof CriteriaChecked] ? (
                        <CheckSquare className="w-6 h-6 text-green-600" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <span className="criteria-text">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="criteria-footer">
                <p className="criteria-counter">
                  {Object.values(criteriaChecked).filter(v => v).length} of {criteria.length} criteria confirmed
                </p>
                <button
                  onClick={handleProceedToForm}
                  disabled={!allCriteriaChecked}
                  className="proceed-button"
                >
                  Proceed to Application
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="form-section">
          <div className="container">
            <div className="form-header">
              <button
                onClick={() => setShowForm(false)}
                className="back-button"
              >
                ← Back to Criteria
              </button>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>Application Form</h2>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="form-error">{errors.fullName}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Age <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your age"
                />
                {errors.age && <p className="form-error">{errors.age}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="10-digit mobile number"
                />
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Address <span className="required">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="form-textarea"
                placeholder="Enter your complete address"
              />
              {errors.address && <p className="form-error">{errors.address}</p>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Education Qualification <span className="required">*</span>
                </label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select qualification</option>
                  <option value="8th">8th Standard</option>
                  <option value="10th">10th Standard</option>
                  <option value="12th">12th Standard</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Post Graduate</option>
                </select>
                {errors.education && <p className="form-error">{errors.education}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Previous Experience (if any)
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Years of relevant experience"
                />
              </div>
            </div>

            <div className="test-booking-section">
              <h3><Calendar className="w-5 h-5" />Book Your Test Slot</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Test Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="testDate"
                    value={formData.testDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                  {errors.testDate && <p className="form-error">{errors.testDate}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Test Time <span className="required">*</span>
                  </label>
                  <select
                    name="testTime"
                    value={formData.testTime}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select time slot</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                  {errors.testTime && <p className="form-error">{errors.testTime}</p>}
                </div>
              </div>

              <p className="test-note">
                <strong>Note:</strong> The test will assess your communication skills, basic health knowledge, and community engagement abilities. Duration: 1 hour.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Submitting...' : 'Submit Application & Book Test'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AshaWorker;