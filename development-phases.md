Development Phases: Afri-Teach
This document outlines the proposed development phases for the Afri-Teach platform. Each phase is designed to build upon the previous one, delivering incremental value and allowing for continuous feedback integration. The timelines provided are estimates and may be adjusted based on development progress and user feedback.

## Phase 1: Minimum Viable Product (MVP) - COMPLETE

Goal: Launch a core, functional platform that enables students to discover and book lessons with teachers, and allows teachers to register, manage availability, and conduct virtual classes. This phase focuses on the absolute essentials to validate the core concept.

### Completed Features:

#### User Authentication & Profiles:
- ✅ Student and Teacher Registration: Streamlined sign-up process using email and password.
- ✅ Basic Profile Creation: Essential information collection (e.g., name, primary subject for teachers).
- ✅ Google OAuth Sign-in: Integration for quick and convenient registration/login.
- ✅ Secure Login/Logout: Standard authentication mechanisms with session management.
- ✅ Password Recovery: "Forgot password" functionality.
- ✅ Onboarding Flow: User role selection and initial profile setup.

#### Teacher Discovery (Basic):
- ✅ Teacher Listing: A simple directory of all registered and approved teachers.
- ✅ Basic Search: Functionality to search teachers by subject category.

#### Scheduling & Booking (Core):
- ✅ Teacher Availability Setting: Teachers can manually input and manage their available time slots.
- ✅ Student Booking Interface: Students can view a teacher's availability and book an open slot.
- ✅ Email Notifications: Automated email confirmations for bookings, cancellations, and reminders.
- ✅ Basic Time Zone Handling: Users can manually select or confirm their time zone.

#### Virtual Classroom (Core):
- ✅ 1-on-1 Video/Audio Call: Real-time communication between student and teacher.
- ✅ Screen Sharing: Ability for either party to share their screen for collaborative learning.

#### Student Dashboard (Basic):
- ✅ Upcoming Lessons View: A clear display of all scheduled lessons with relevant details.
- ✅ Join Lesson Button: Direct access to the virtual classroom for upcoming lessons.
- ✅ Real-time Data Integration: Dashboard shows real-time lesson and notification data.

#### Teacher Dashboard (Basic):
- ✅ Upcoming Lessons View: A clear display of all scheduled lessons with student details.
- ✅ Manually Mark Lessons as Completed: A simple mechanism for teachers to confirm lesson completion.
- ✅ Join Lesson Button: Direct access to the virtual classroom for upcoming lessons.
- ✅ Real-time Data Integration: Dashboard shows real-time lesson, profile, and earning data.
- ✅ Profile Management: Teachers can manage their subjects, hourly rate, and profile details.

#### Admin Panel:
- ✅ Teacher Account Verification: A simple interface for administrators to review and approve newly registered teacher accounts.

### Technologies Used:
- ✅ Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- ✅ Backend: Supabase (Authentication, Database, Storage)
- ✅ Media Storage: Cloudinary integration
- ✅ Video Conferencing: Basic WebRTC implementation
- ✅ Payment Gateway: Stripe integration
- ✅ Email Service: Email templates and notifications (mock)
- ✅ Database: Supabase PostgreSQL
- ✅ Hosting: Vercel ready

## Phase 2: Enhancing Core Experience & Monetization - IN PROGRESS

Goal: Improve user experience, introduce fundamental monetization features, and add essential functionalities like ratings and more robust dashboards to enhance user trust and engagement.

### Completed Features:
- ✅ Database Schema Overhaul: Complete redesign of the database structure with proper relationships and optimized tables
- ✅ Enhanced Teacher Profiles: Updated profiles with introduction videos, time zone support, and improved qualification storage
- ✅ Smart Time Zone Support: Both teachers and students can now set their time zones for better coordination
- ✅ Teacher Verification Status: Teachers now have verification status that can be managed by admins
- ✅ Improved Profile Management: Better UI for managing profile information with additional fields
- ✅ Rating System Foundation: Database structure and triggers for automatic rating calculation

### In Progress Features:
- 🔄 Enhanced Student Profiles: More detailed student profiles with learning preferences
- 🔄 Advanced Search & Filtering
- 🔄 Payment Integration (Basic)

### Planned Features:
- Review System
- Improved Dashboards
- Notifications

### Key Features:
#### Enhanced Profiles:
- Teacher Profiles: Allow teachers to add comprehensive details such as their educational background, years of experience, specific qualifications, a detailed introductory text, and an introductory video link.
- Student Profiles: Include a view of past lesson history, allowing students to track their learning journey.

#### Advanced Search & Filtering:
- Refined Teacher Search: Enable students to filter teachers by availability, subject sub-categories, grade levels taught, and average ratings.
- Sorting Options: Sort search results by relevance, rating, or price.

#### Payment Integration (Basic):
- Per-Lesson Payment: Integrate the chosen payment gateway (e.g., Stripe) to allow students to securely pay for individual lessons at the time of booking.
- Teacher Earnings Tracking: Teachers can view their accumulated earnings within their dashboard.

#### Rating & Review System:
- Post-Lesson Feedback: Students can submit numerical ratings and written reviews for teachers after a lesson has been completed.
- Public Display of Ratings: Average ratings and selected reviews are displayed prominently on teacher profiles.

#### Improved Dashboards:
- Student Dashboard:
  - Booking Management: Students can reschedule or cancel upcoming lessons.
  - Payment History: View records of all past transactions.
- Teacher Dashboard:
  - Comprehensive Booking Management: Better overview and management of all scheduled and past lessons.
  - Student List: View a list of their past and current students.
  - Basic Earnings Report: Detailed breakdown of earnings.

#### Notifications:
- In-App Notifications: Real-time alerts within the platform for new bookings, lesson reminders, and other relevant events.
- Enhanced Email Reminders: More detailed and timely email notifications for upcoming lessons, payment confirmations, etc.

Timeline: (Estimate: 6-10 weeks from current date)

## Phase 3: Scaling and Feature Enrichment
Goal: Implement features that enhance engagement, streamline teacher management, and provide robust administrative tools, preparing the platform for increased user volume and complexity.
Key Features:
Teacher Payout System:


Automated or Semi-Automated Payouts: Implement a system for regular, secure transfers of earned funds to teachers, potentially integrating with services like Stripe Connect or direct bank transfers.
Advanced Virtual Classroom Features:


Interactive Whiteboard: A collaborative online whiteboard for real-time drawing, writing, and diagramming.
File Sharing: Ability to securely share documents, images, and other learning materials within the classroom environment.
Lesson Recording: Option to record lessons (with explicit consent from both parties) for later review by students.
Messaging System:


In-App Chat: A dedicated messaging interface allowing students and teachers to communicate securely outside of scheduled lessons, facilitating questions or clarifications.
Admin Dashboard (Comprehensive):


Granular User Management: Tools for administrators to manage (suspend, delete, edit) both student and teacher accounts.
Dispute Resolution Tools: Features to mediate and resolve conflicts or issues between students and teachers (e.g., booking discrepancies, payment issues).
Basic Analytics & Reporting: Dashboards providing insights into user growth, lesson volume, revenue, and other key performance indicators.
Content Management: Ability to manage subjects, categories, and other platform-wide content.
Teacher Verification Workflow:


Streamlined Verification: Develop a more robust process for administrators to review and approve teacher credentials, including document uploads (e.g., certificates, ID) and background checks (if applicable).
Performance Optimizations & Security Hardening:


Scalability Improvements: Optimize database queries, API responses, and infrastructure to handle increased user load.
Enhanced Security Measures: Implement advanced security protocols, regular vulnerability assessments, and data encryption to protect sensitive user and payment information.

## Phase 4: Growth & Expansion
Goal: Introduce features specifically designed to drive user acquisition, improve retention, and expand the platform's educational and cultural offerings, positioning Afri-Teach for long-term sustainability and impact.
Key Features:
Mobile Responsiveness & Progressive Web App (PWA):


Full Mobile Optimization: Ensure the entire platform is fully responsive and provides an excellent user experience across all mobile devices.
PWA Implementation: Develop a Progressive Web App to allow users to "install" the web application to their home screen, providing an app-like experience without requiring app store downloads.
Advanced Analytics:


Student Progress Tracking: Tools for students to visualize their learning progress over time, perhaps tied to subjects or specific skills.
Teacher Performance Insights: Detailed analytics for teachers on their lesson performance, student engagement, and earnings trends.
Lesson Packages & Subscriptions:


Flexible Offerings: Allow teachers to create and offer bundles of lessons at a discounted rate.
Subscription Models: Explore and implement subscription options for students (e.g., monthly access to a certain number of lessons or unlimited access to specific content).
Cultural Exchange Features:


Dedicated Cultural Sharing: Implement features within profiles or lesson contexts that encourage and facilitate cultural sharing between students and teachers (e.g., prompts, suggested discussion topics).
Community Features (Optional - based on user feedback):


Forums or Discussion Groups: Create a space for students and/or teachers to interact, share knowledge, and build a sense of community around learning.
Referral Programs:


Incentivized Referrals: Implement a system to reward existing users for referring new students or teachers to the platform.
SEO Optimization:


Search Engine Visibility: Implement comprehensive SEO strategies to improve the platform's organic search ranking, making it easier for potential users to find Afri-Teach.
Timeline: (Ongoing, iterative development after Phase 3, with features prioritized based on market demand and user feedback)

Post-Launch / Future Considerations:
These are potential long-term features that could be explored after the successful implementation of the initial phases:
Native Mobile Applications (iOS/Android): Dedicated apps for a more integrated and performant mobile experience.
Group Lessons: Ability for teachers to conduct lessons with multiple students simultaneously.
AI-Powered Recommendations: Using AI to recommend teachers or learning paths based on student preferences and performance.
Support for Multiple Languages: Localizing the platform interface to cater to a broader international audience.
Integration with External Calendars: Allowing teachers to sync their availability with external calendar services (e.g., Google Calendar, Outlook Calendar) for easier management.
This phased approach emphasizes iterative development, incorporates user feedback at each stage, and allows for effective risk mitigation, ensuring the continuous evolution of the Afri-Teach platform.
