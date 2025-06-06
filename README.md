# Afri-Teach

Afri-Teach is an online platform that connects students with teachers from Africa, providing accessible, high-quality education through virtual classrooms.

## Overview

Afri-Teach aims to bridge educational gaps by leveraging technology to connect students with qualified teachers from across Africa. The platform facilitates scheduling, booking, and conducting virtual lessons in various subjects.

## Features

### Core Features (Phase 1 MVP - Completed)
- **User Authentication**: Secure login, registration, and password reset functionality
  - Email/password authentication
  - Google OAuth sign-in
- **User Profiles**: Dedicated profiles for both students and teachers
- **Teacher Discovery**: Browse and search for teachers by subject, specialty, or country
- **Scheduling System**: Teachers can set recurring and specific date availabilities
- **Booking System**: Students can book lessons with teachers based on availability
- **Virtual Classroom**: Integrated video conferencing with chat and learning materials
- **Notifications**: Email notifications for booking confirmations and reminders

### Coming in Phase 2
- Payment processing integration
- Enhanced analytics for teachers
- More advanced scheduling features
- Student reviews and ratings system
- Mobile app development

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API
- **Form Handling**: react-hook-form with Zod validation
- **Routing**: React Router
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/afri-teach.git
   cd afri-teach
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the necessary environment variables:
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google OAuth Configuration (if using Google Sign-in)
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   
   # Agora SDK Configuration (for virtual classroom)
   VITE_AGORA_APP_ID=your_agora_app_id
   
   # Other Configuration
   VITE_APP_URL=http://localhost:5173
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and visit `http://localhost:5173`

## Environment Variables

The application uses environment variables for configuration. These should be set in a `.env` file:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for sign-in | For Google Auth |
| `VITE_AGORA_APP_ID` | Agora app ID for virtual classroom | For Video Calls |
| `VITE_APP_URL` | Base URL of your application | Recommended |

For local development, you can use the fallback values in the code, but for production, all variables should be properly set.

## Environment Setup

### Supabase Configuration
1. Create a Supabase account at [https://supabase.io](https://supabase.io)
2. Create a new project in Supabase
3. Copy the URL and Anon Key from your project settings
4. Create a `.env` file in the root of your project with the following content:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Cloudinary Configuration
1. Create a Cloudinary account at [https://cloudinary.com](https://cloudinary.com)
2. From your Dashboard, get your Cloud Name, API Key, and API Secret
3. Add these to your `.env` file:
```
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_API_SECRET=your-api-secret
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── integrations/     # Third-party service integrations
├── lib/              # Utility functions and helpers
├── pages/            # Page components
├── services/         # API and business logic services
├── styles/           # Global styles and theme configuration
├── types/            # TypeScript type definitions
├── App.tsx           # Main application component
└── main.tsx          # Application entry point
```

## Development Phases

The project is being developed in phases:

### Phase 1 (MVP) - Completed
- Authentication and user profiles
- Teacher discovery
- Scheduling and booking system
- Virtual classroom
- Email notifications

### Phase 2 (In Planning)
- Payment processing
- Enhanced analytics
- Advanced scheduling
- Reviews and ratings
- Mobile app

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- All the amazing teachers in Africa who inspire this project
- The open-source community for the tools and libraries used

## Recent Updates

We've made significant progress integrating real data services:

1. **Authentication Improvements**:
   - Added Google OAuth sign-in
   - Created streamlined onboarding flow
   - Improved password management and verification

2. **Real Data Integration**:
   - Implemented Supabase database connection for lessons and notifications
   - Created teacher profile service for profile management
   - Added payment service for tracking earnings
   - Built notification service for real-time alerts

3. **Teacher Dashboard Enhancements**:
   - Updated interface to display real-time lesson data
   - Added profile management functionality
   - Integrated earnings tracking and reporting
   - Improved upcoming lessons display

4. **Upcoming Features**:
   - Admin panel for teacher verification
   - Payment processing with Stripe
   - Enhanced analytics for teachers
   - Ratings and reviews system

See the [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and updates.
