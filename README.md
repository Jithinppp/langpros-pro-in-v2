# LangPros Pro Inventory Manager

A modern, production-ready inventory management system built with React, TypeScript, and Supabase. This application provides a comprehensive solution for tracking equipment, managing storage locations, and generating reports.

![React](https://img.shields.io/badge/React-19.2.4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![Vite](https://img.shields.io/badge/Vite-8.0.1-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Functionality

- **Equipment Management** - Add, view, edit, and track equipment inventory
- **Category System** - Organize equipment by categories, subcategories, and models
- **Storage Locations** - Manage multiple storage locations with detailed tracking
- **Auto-generated SKU** - Automatic SKU generation based on category, subcategory, and model
- **Warranty Tracking** - Track warranty expiry dates with automatic validation

### User Experience

- **Role-based Access** - Different dashboards for Admin, Inventory Manager, and Project Manager
- **Responsive Design** - Fully responsive UI that works on desktop and mobile devices
- **Real-time Validation** - Inline form validation with immediate feedback
- **Modern UI** - Clean, professional interface with Tailwind CSS styling

### Technical Features

- **Type-safe Code** - Full TypeScript implementation with strict type checking
- **State Management** - Zustand for global state management
- **Data Fetching** - TanStack Query for efficient server state management
- **Form Handling** - React Hook Form with Zod validation
- **Backend Integration** - Supabase for database and authentication

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/langpros-pro-in-v2.git
   cd langpros-pro-in-v2
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy the environment example and configure your credentials:
     ```bash
     # Create .env file with your Supabase credentials
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

4. **Set up the database**
   - Run the SQL migrations in the `/supabase` folder (if provided)
   - Or create tables for: `categories`, `subcategories`, `models`, `storage_locations`, `assets`

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
langpros-pro-in-v2/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx      # Custom button component
│   │   ├── Input.tsx       # Form input component
│   │   ├── Layout.tsx      # Main layout wrapper
│   │   ├── Loading.tsx      # Loading spinner
│   │   └── ProtectedRoute.tsx  # Auth protection
│   ├── constants/           # Application constants
│   ├── lib/                # Third-party library configs
│   │   └── supabase.ts     # Supabase client setup
│   ├── pages/              # Page components
│   │   ├── admin/          # Admin dashboard
│   │   ├── inventory-manager/  # Inventory manager pages
│   │   └── tech/           # Technician dashboard
│   ├── routes/             # Application routes
│   ├── store/              # Zustand stores
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

## 🛠️ Technology Stack

| Category          | Technology                 |
| ----------------- | -------------------------- |
| **Frontend**      | React 19, TypeScript, Vite |
| **Styling**       | Tailwind CSS 4             |
| **State**         | Zustand, TanStack Query    |
| **Forms**         | React Hook Form, Zod       |
| **UI Components** | Headless UI, Lucide Icons  |
| **Backend**       | Supabase                   |
| **Routing**       | React Router DOM           |

## 📋 Available Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run lint`    | Run ESLint               |
| `npm run preview` | Preview production build |

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🎨 Color Scheme

The application uses a professional blue color palette:

- **Primary**: `#1769ff` (Blue)
- **Primary Hover**: `#1255d4` (Darker Blue)
- **Success**: `#00d26a` (Green)
- **Error**: `#d26a00` (Orange/Red)
- **Background**: White with gray borders

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

The layout automatically adjusts grid columns and spacing based on screen size.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Supabase](https://supabase.com/) - The open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icons for everyone
- [React](https://react.dev/) - The library for web and native user interfaces

---

<p align="center">Built with ❤️ using React, TypeScript, and Supabase</p>
