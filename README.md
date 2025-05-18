# MedTrack - Medication Tracking Application

MedTrack is a personal medication tracking application that helps users manage their medications, get reminders, and track their adherence to medication schedules.

## Features

- 🔐 User Authentication
- 💊 Medication Management
- ⏰ Dose Reminders
- 📊 Adherence Tracking
- 📱 Mobile-Friendly Interface
- 📁 Report Generation (PDF/CSV)

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- PDFKit for PDF generation
- Node-cron for scheduling

### Frontend (Coming Soon)
- React
- Material-UI
- Chart.js for statistics
- React Router for navigation

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medtrack.git
cd medtrack
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medtrack
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup (Coming Soon)

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Medications
- GET `/api/medications` - Get all medications
- POST `/api/medications` - Add new medication
- PUT `/api/medications/:id` - Update medication
- DELETE `/api/medications/:id` - Delete medication

### Doses
- GET `/api/doses/upcoming` - Get upcoming doses
- GET `/api/doses/today` - Get today's doses
- POST `/api/doses/:id/take` - Mark dose as taken
- GET `/api/doses/stats` - Get adherence statistics
- GET `/api/doses/medication/:medicationId/stats` - Get medication-specific stats

### Reports
- GET `/api/reports/pdf` - Generate PDF report
- GET `/api/reports/csv` - Generate CSV report

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons by [Font Awesome](https://fontawesome.com)
- Design inspiration from various healthcare applications 