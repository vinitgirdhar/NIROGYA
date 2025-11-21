# Nirogya - Smart Health Surveillance and Early Warning System# Getting Started with Create React App
A comprehensive React-based web application for monitoring water-borne diseases in vulnerable communities, particularly designed for the Northeastern Region (NER) of India.This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


## 🎯 Project Overview## Available Scripts
Nirogya is a digital health platform that addresses the critical need for early detection and prevention of water-borne diseases such as diarrhea, cholera, typhoid, and hepatitis A in rural and tribal communities. The system provides real-time health surveillance, water quality monitoring, and community reporting capabilities.In the project directory, you can run:

## ✨ Key Features### `npm start`
### 1. **Health Surveillance Dashboard**Runs the app in the development mode.\

- Real-time disease tracking and monitoringOpen [http://localhost:3000](http://localhost:3000) to view it in the browser.

- Interactive data visualizations and charts

- Disease hotspot mappingThe page will reload if you make edits.\

- Resource allocation overviewYou will also see any lint errors in the console.

- Weekly and historical trend analysis

### `npm test`

### 2. **Health Data Collection**

- Comprehensive patient case reportingLaunches the test runner in the interactive watch mode.\

- Symptom tracking and severity assessmentSee the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

- Disease type classification

- Location-based case mapping### `npm run build`

- Contact tracing capabilities

Builds the app for production to the `build` folder.\

### 3. **Water Quality Monitoring**It correctly bundles React in production mode and optimizes the build for the best performance.

- IoT sensor data integration

- Manual water test result entryThe build is minified and the filenames include the hashes.\

- Real-time water source status trackingYour app is ready to be deployed!

- Contamination alerts and warnings

- Parameter monitoring (pH, turbidity, bacterial count, chlorine levels)See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### 4. **Community Reporting Interface**### `npm run eject`

- Multi-step symptom reporting form

- User-friendly interface for community members**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

- Multilingual support (English, Hindi, with extensibility for tribal languages)

- Family health trackingIf you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

- Water source information collection

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

### 5. **Multilingual Support**

- English and Hindi translationsYou don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

- Extensible framework for tribal languages

- Context-aware language switching## Learn More

- Cultural sensitivity considerations

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

## 🛠 Technology Stack

To learn React, check out the [React documentation](https://reactjs.org/).

- **Frontend**: React 19.x with TypeScript
- **UI Framework**: Ant Design (antd)
- **Routing**: React Router v6
- **Data Visualization**: Recharts
- **Internationalization**: react-i18next
- **Styling**: CSS Modules + Ant Design theming

## 📦 Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000` (or `http://localhost:3001` if 3000 is in use)

3. **Build for production**
   ```bash
   npm run build
   ```

## 🏗 Project Structure

```
paani-care/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Layout.tsx
│   │   └── *.css
│   ├── pages/               # Main application pages
│   │   ├── Dashboard.tsx
│   │   ├── HealthData.tsx
│   │   ├── WaterQuality.tsx
│   │   ├── Community.tsx
│   │   └── *.css
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── locales/            # Internationalization files
│   │   ├── en.ts
│   │   ├── hi.ts
│   │   └── index.ts
│   ├── App.tsx
│   ├── App.css
│   └── index.tsx
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Current Features Implemented

### ✅ Completed Modules

1. **Dashboard** - Health surveillance dashboard with data visualizations
2. **Health Data Collection** - Patient case reporting and management
3. **Water Quality Monitoring** - Water source tracking and testing
4. **Community Reporting** - Multi-step symptom reporting interface
5. **Multilingual Support** - English and Hindi language support
6. **Responsive Design** - Mobile-friendly interface

### 🚧 Future Enhancements

- Alert management system
- Educational resources module
- Real-time IoT sensor integration
- Mobile application
- Advanced analytics and AI/ML predictions

## 📱 Application Screenshots

### Dashboard
- Real-time statistics cards showing total cases, active cases, resolved cases
- Interactive charts for weekly health trends and disease distribution
- Water quality overview with contamination status
- Recent activity timeline and hotspot analysis

### Health Data Collection
- Comprehensive patient case reporting form
- Symptoms selection with severity assessment
- Patient search and case management table
- Disease type classification and tracking

### Water Quality Monitoring
- Water source status tracking with safety indicators
- Parameter monitoring (pH, turbidity, bacterial count, chlorine levels)
- Test result entry for manual and IoT sensor data
- Water quality trends visualization

### Community Reporting
- Step-by-step symptom reporting wizard
- Family health tracking capabilities
- Water source information collection
- Prevention tips and emergency information

## 🌐 Internationalization

The application supports multiple languages:

- **English (en)**: Default language
- **Hindi (hi)**: Regional language support
- **Extensible Framework**: Ready for tribal languages like Assamese, Bodo, Khasi

## 🎨 User Interface

The application features:

- Clean, modern design with Ant Design components
- Intuitive navigation with collapsible sidebar
- Data visualization with interactive charts (Recharts)
- Form validation and user feedback
- Consistent color scheme and typography
- Mobile-responsive design

## 🔧 Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and uses:

- **TypeScript** for type safety
- **ESLint** for code quality
- **CSS Modules** for component styling
- **React Router** for navigation
- **Ant Design** for UI components

## 🌟 Key Benefits

1. **Early Disease Detection**: Helps identify disease outbreaks before they spread
2. **Community Engagement**: Easy-to-use interface for community health reporting
3. **Water Safety Monitoring**: Real-time tracking of water source contamination
4. **Data-Driven Decisions**: Visual analytics for health officials
5. **Multilingual Accessibility**: Supports local languages for better adoption
6. **Mobile-First Design**: Works on smartphones in remote areas

## 🎯 Target Users

- **Health Workers**: For comprehensive case reporting and patient management
- **Community Members**: For symptom reporting and health information
- **District Health Officials**: For monitoring and decision making
- **ASHA Workers**: For field data collection and community outreach
- **Government Agencies**: For policy making and resource allocation

## 📞 Support

For technical support, feature requests, or contributions:

- Create an issue in the project repository
- Contact the development team
- Check the documentation for troubleshooting

## 🏆 Project Status

**Current Status**: ✅ **Production Ready**

- All core modules implemented and tested
- Responsive design working across devices
- Multilingual support functional
- No compilation errors
- Ready for deployment

## 🚀 Deployment

The application can be deployed to:

- **Vercel** (recommended for React apps)
- **Netlify** (static site hosting)
- **AWS S3 + CloudFront** (scalable hosting)
- **Azure Static Web Apps** (Microsoft cloud)
- **Firebase Hosting** (Google cloud)

---

**Nirogya** - *Safeguarding Community Health Through Technology*

*Built with ❤️ for the Northeastern Region communities*#   n i r 
 
 


# Nirogya Project Setup Guide

## Prerequisites

Before starting, ensure you have the following installed on your system:

1. **Python 3.11** (NOT 3.13 or any other version)
2. **Node.js** (version 16 or higher)
3. **npm** (comes with Node.js)
4. **Git** (for version control)

## Verifying Python Version

First, check if you have Python 3.11 available:

```powershell
py -0
```

You should see Python 3.11 in the list. If not, download and install Python 3.11 from [python.org](https://www.python.org/downloads/).

## Project Structure

```
Nirogya/
├── backend/           # FastAPI backend
├── src/              # React frontend source
├── public/           # React public files
├── package.json      # Frontend dependencies
└── README.md         # This file
```

## Step-by-Step Setup Instructions

### Step 1: Clone and Navigate to Project

```powershell
cd "C:\Users\hp\OneDrive\Desktop\Nirogya-a\Nirogya-initial\Nirogya"
```

### Step 2: Frontend Setup

1. **Install Node.js dependencies:**
   ```powershell
   npm install
   ```

2. **Verify installation:**
   ```powershell
   npm list --depth=0
   ```

### Step 3: Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Remove any existing virtual environment:**
   ```powershell
   Remove-Item -Recurse -Force venv -ErrorAction SilentlyContinue
   ```

3. **Create virtual environment with Python 3.11:**
   ```powershell
   py -3.11 -m venv venv
   ```

4. **Activate the virtual environment:**
   ```powershell
   .\venv\Scripts\activate
   ```

5. **Verify Python version (should show 3.11.x):**
   ```powershell
   python --version
   ```

6. **Install backend dependencies:**
   ```powershell
   python -m pip install -r requirements.txt
   ```

7. **Install additional required packages:**
   ```powershell
   pip install email-validator
   pip install "pydantic[email]"
   pip install "PyJWT[crypto]"
   pip install passlib[bcrypt]
   pip install bcrypt==4.0.1
   ```

8. **Navigate back to project root:**
   ```powershell
   cd ..
   ```

### Step 4: Environment Configuration

1. **Check if .env file exists in backend directory:**
   ```powershell
   ls backend/.env
   ```

2. **If .env doesn't exist, create it:**
   ```powershell
   New-Item -Path "backend/.env" -ItemType File -Force
   ```

3. **Add basic environment variables to .env:**
   ```
   MONGODB_URI=mongodb://localhost:27017/nirogya
   JWT_SECRET_KEY=your-secret-key-here
   POLL_INTERVAL_SECONDS=5
   ```

### Step 5: Start the Application

#### Terminal 1 - Backend Server

1. **Open PowerShell and navigate to project root:**
   ```powershell
   cd "C:\Users\hp\OneDrive\Desktop\Nirogya-a\Nirogya-initial\Nirogya"
   ```

2. **Activate virtual environment:**
   ```powershell
   .\backend\venv\Scripts\activate
   ```

3. **Start backend server:**
   ```powershell
   uvicorn backend.app:app --reload --port 8000
   ```

   **Expected Output:**
   ```
   INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   INFO: Started reloader process using WatchFiles
   Predictor: model loaded from backend/models/disease_prediction_model.joblib
   INFO: Started server process
   INFO: Waiting for application startup.
   Background poller started.
   ML_READY = True
   INFO: Application startup complete.
   ```

#### Terminal 2 - Frontend Server

1. **Open a new PowerShell window and navigate to project root:**
   ```powershell
   cd "C:\Users\hp\OneDrive\Desktop\Nirogya-a\Nirogya-initial\Nirogya"
   ```

2. **Start frontend development server:**
   ```powershell
   npm start
   ```

   **Expected Output:**
   ```
   Compiled successfully!
   You can now view nirogya in the browser.
   Local:            http://localhost:3000
   ```

### Step 6: Verify Application is Running

1. **Backend API:** Open http://localhost:8000/docs in your browser to see the FastAPI documentation
2. **Frontend:** Open http://localhost:3000 in your browser to see the React application

## Troubleshooting

### Issue 1: "ModuleNotFoundError: No module named 'backend'"
**Solution:** Make sure you're running uvicorn from the project root directory, not from inside the backend directory.

### Issue 2: "ModuleNotFoundError: No module named 'jwt'"
**Solution:** Install PyJWT with crypto support:
```powershell
pip install "PyJWT[crypto]"
```

### Issue 3: "email-validator is not installed"
**Solution:** Install email validator:
```powershell
pip install email-validator
pip install "pydantic[email]"
```

### Issue 4: Python version issues
**Solution:** Ensure you're using Python 3.11:
```powershell
# Delete and recreate venv with correct Python version
Remove-Item -Recurse -Force backend\venv
cd backend
py -3.11 -m venv venv
.\venv\Scripts\activate
python --version  # Should show 3.11.x
```

### Issue 5: Port already in use
**Solution:** Kill existing processes:
```powershell
# Kill Node.js processes
taskkill /F /IM node.exe /T

# Kill Python processes
taskkill /F /IM python.exe /T
```

## Development Workflow

### Starting Development Session

1. **Terminal 1 (Backend):**
   ```powershell
   cd "C:\Users\hp\OneDrive\Desktop\Nirogya-a\Nirogya-initial\Nirogya"
   .\backend\venv\Scripts\activate
   uvicorn backend.app:app --reload --port 8000
   ```

2. **Terminal 2 (Frontend):**
   ```powershell
   cd "C:\Users\hp\OneDrive\Desktop\Nirogya-a\Nirogya-initial\Nirogya"
   npm start
   ```

### Stopping the Application

- **Backend:** Press `Ctrl+C` in the backend terminal
- **Frontend:** Press `Ctrl+C` in the frontend terminal

## Project URLs

- **Frontend Application:** http://localhost:3000
- **Backend API Documentation:** http://localhost:8000/docs
- **Backend API:** http://localhost:8000

## Common Commands

### Update Dependencies

**Frontend:**
```powershell
npm update
```

**Backend:**
```powershell
.\backend\venv\Scripts\activate
pip install --upgrade -r backend/requirements.txt
```

### Add New Dependencies

**Frontend:**
```powershell
npm install package-name
```

**Backend:**
```powershell
.\backend\venv\Scripts\activate
pip install package-name
# Add to requirements.txt manually
```

## Notes

- Always use Python 3.11 for the backend
- Keep both servers running during development
- The backend serves API endpoints while frontend serves the web interface
- Hot reload is enabled for both frontend and backend development

## Support

If you encounter any issues not covered in this guide:

1. Check that all prerequisites are installed correctly
2. Verify Python version is 3.11
3. Ensure all dependencies are installed
4. Check that ports 3000 and 8000 are not being used by other applications

---

**Happy Coding! 🚀**