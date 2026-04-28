# Sahyog - AI Community Pulse 🤝

*Sahyog* is an AI-powered community needs aggregator and volunteer matching platform designed to turn scattered field data into structured, actionable humanitarian intelligence.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Store%20%26%20Auth-FFCA28?logo=firebase)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4?logo=google-gemini)

---

## 🌟 Key Features

### 1. Intelligence Intake 🧠
Field workers and citizens can report needs via text or images. Our AI pipeline automatically:
- *Categorizes*: Tags the need (e.g., Medical, Food, Shelter).
- *Scores Urgency*: Calculates a priority score (0-100) based on severity and population impact.
- *Extracts Essentials*: Pulls out contact info, locations, and quantity requirements.

### 2. Volunteer Portal & Real-time Matching 🚑
A smart dispatch system that connects volunteers to high-priority tasks:
- Matches based on proximity and skill relevance.
- Monitors *Volunteer Fatigue* to prevent burnout.
- Real-time status updates via Firebase.

### 3. Impact Analytics Dashboard 📊
Visualize the "Community Pulse" with dynamic charts:
- *Trend Analysis*: See how needs shift over time.
- *Predictive Insights*: AI-generated forecasts for the next 48 hours based on historical field data.

### 4. Semantic AI Assistant 🤖
A context-aware field assistant that helps admins query the database using natural language (e.g., "Where is medical aid needed most right now?").

### 5. Multilingual & Inclusive 🌍
Dynamic language switching (English, Hindi, etc.) ensures that the tool is accessible to diverse local communities.

---

## 🛠 Tech Stack

- *Framework*: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- *Styling*: [Tailwind CSS v4](https://tailwindcss.com/)
- *State & DB*: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- *Auth*: [Firebase Auth](https://firebase.google.com/docs/auth) (Google Sign-In)
- *AI Content*: [Google Gemini API](https://ai.google.dev/)
- *Animations*: [Framer Motion](https://www.framer.com/motion/)
- *Data Viz*: [Recharts](https://recharts.org/)
- *Icons*: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud Project with the *Gemini API* enabled.

### Installation

1. *Clone the repository:*
   bash
   git clone https://github.com/your-username/sahyog.git
   cd sahyog
   

2. *Install dependencies:*
   bash
   npm install
   

3. *Environment Configuration:*
   Create a .env file in the root and add your Gemini API key:
   env
   GEMINI_API_KEY=your_gemini_api_key_here
   

4. *Run the development server:*
   bash
   npm run dev
   

---

## 📐 Architecture

- *src/components/*: Modularized UI components (Dashboard, Map, AIAssistant, etc.).
- *src/lib/ai.ts*: Core service for interacting with Gemini for categorization, scoring, and matching.
- *src/lib/firebase.ts*: Shared Firebase initialization and error handling.
- *src/context/*: Global state management for languages and user preferences.

---

## 🤝 Contributing

We welcome contributions! Whether it's fixing a bug or suggesting a new AI model for triage, feel free to open a PR.

## 📄 License

Distributed under the MIT License. See LICENSE for more information.
