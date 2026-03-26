# Timesheet Automator

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![ExcelJS](https://img.shields.io/badge/ExcelJS-4.4-107C41.svg?style=flat-square&logo=microsoft-excel)](https://github.com/exceljs/exceljs)

> An aesthetic, fully-automated Next.js local companion app to directly manage, log, analyze, and format complex corporate Microsoft Excel timesheets.

**Made by [Kavin1421](https://github.com/Kavin1421)**

---

## 🚀 Features

* **Direct Excel Integration**: Connects directly to local `.xlsx` files without databases. Handles background file-locks securely and retries seamlessly.
* **Modern Daily Logging**: Simple, intuitive wizard for tracking "Normal", "Sick Leave" or "Planned Leave" days, including visual hour-sliders and drop-down mapped corporate mappings.
* **Historical Database & Analytics**: Search, filter, and review every past entry. Enjoy a fully-fledged interactive dashboard powered by *Recharts*, tracking a 90-day GitHub-style heat matrix and weekly velocity.
* **Intelligent Auto-Format / Billing Export**: One-click generation perfectly mapped to complex internal Manager Billing `.xlsx` templates.
* **Advanced Reordering & Quick Cloning**: Fix layout orders chronologically by swapping them securely *at the binary cell level* inside Excel. Rapidly duplicate routine tasks to today's spreadsheet line in a single click.

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A local target timesheet template

## 💻 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kavin1421/TimeSheet_Automator.git
   cd TimeSheet_Automator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root copying `.env.example`:
   ```env
   EXCEL_PATH=C:\path\to\your\timesheet.xlsx
   EXPORT_PATH=C:\path\to\manager\exports\
   PROJECT_NOTES="Banco CTT - UB Intl"
   ```

## ⚙️ Running the Application

### Using Included Scripts (Auto-Logging)
The application comes pre-bundled with background logging scripts. Outputs are dynamically piped into `logs/app.log`.

**On Windows:**
```bat
start.bat
stop.bat
```

**On Linux/Mac:**
```bash
./start.sh
./stop.sh
```

### Manual Development
```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

## 📚 API Architecture & Swagger Docs

The companion exposes robust Next.js API endpoints communicating directly via the Node file system (`fs`) protocols to bypass standard spreadsheet software concurrency issues.

* Full Swagger Interface provided dynamically at `http://localhost:3000/api-docs`.

---
*Developed & Maintained by Kavin1421*
