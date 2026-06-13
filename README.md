# ThreatForge 🛡️

*An AI-Powered, Document-Oriented Threat Modeling Workspace*

ThreatForge is a modern threat modeling workspace designed to help security engineers and developers identify, analyze, and mitigate security threats. By combining **STRIDE threat modeling methodology** with **Large Language Models (LLMs)**, ThreatForge automates the tedious parts of threat modeling while keeping all project configurations, architectures, and modules in simple, human-readable, and version-control-friendly plain text files.

---

## 🌟 Key Features

*   **AI-Powered STRIDE Analysis:** Automatically generates comprehensive threat models mapping to all 6 STRIDE categories (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) using LLMs via OpenRouter.
*   **Document-Oriented Local Storage:** Stores project metadata, architecture, and module threat models directly as structured, plain-text `.txt` files under a `Projects/` folder. Easily commit files to Git, perform manual edits, or backing up configurations.
*   **Component-Level Modular Modeling:** Break down complex systems into logical, independent modules (e.g., Auth service, Payment gateway, Database), each with custom notes and scoped threat profiles.
*   **Interactive Risk Dashboard:** Displays real-time charts and metrics including total threats, modules count, and severity breakdowns (Critical, High, Medium, Low).
*   **Professional PDF & Text Exports:** Compile all module threat models and project architecture details into a styled PDF report (generated using ReportLab) or structured plain text report with a single click.

---

## ⚙️ Architecture & Directory Structure

ThreatForge consists of a **Python FastAPI backend**, a **Vite/React/TypeScript frontend**, and a **plain text database directory (`Projects/`)**.

```text
ThreatForge/
├── backend/
│   ├── ai.py             # OpenRouter client & STRIDE system prompting
│   ├── main.py           # FastAPI server definitions & API routes
│   ├── storage.py        # Custom file parser, serializer, and report generator (ReportLab PDF)
│   ├── config.py         # App configuration & environment loader
│   ├── requirements.txt  # Python dependencies
│   └── .env              # Backend configuration variables
├── frontend/
│   ├── src/
│   │   ├── components/   # UI panels (Dashboard, Modules, Reports, ProjectInfo, Sidebar, etc.)
│   │   ├── App.tsx       # Main app layout, routing, and UI view controller
│   │   ├── api.ts        # Typed HTTP client communicating with backend API
│   │   ├── index.css     # Global styles & Tailwind CSS configuration
│   │   └── main.tsx      # React app entry point
│   ├── package.json      # Node.js scripts & dependencies
│   └── vite.config.ts    # Vite environment configuration
└── Projects/             # Human-readable workspace directories (created on run)
    └── [Project_Name]/
        ├── Project Info.txt    # Project metadata (Name, Description, Tech Stack, Notes)
        ├── Architecture.txt    # Application architecture described in plain text
        ├── Modules/
        │   └── [Module_Name].txt  # Notes & threat table in pipe-separated format
        └── Reports/
            └── Threat Report.txt  # Compiled text report output
```

---

## 🚀 Getting Started

### 📋 Prerequisites
*   **Python 3.8 or higher**
*   **Node.js 18 or higher** (with `npm` or `yarn`)
*   An **OpenRouter API Key** (or any compatible OpenAI/LLM endpoint)

---

### 1. Setup the Backend

1.  Navigate into the `backend/` directory:
    ```bash
    cd backend
    ```

2.  Create and activate a Python virtual environment:
    *   **Windows (PowerShell):**
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Configure environment variables:
    *   Create a `.env` file in the `backend/` folder (or edit the existing one):
        ```env
        OPENROUTER_API_KEY=your_openrouter_api_key_here
        OPENROUTER_MODEL=openai/gpt-oss-120b:free  # Or another preferred model
        ```

5.  Start the FastAPI server:
    ```bash
    python main.py
    ```
    The API server runs by default at `http://127.0.0.1:8000`.

---

### 2. Setup the Frontend

1.  Navigate into the `frontend/` directory:
    ```bash
    cd ../frontend
    ```

2.  Install the required Node packages:
    ```bash
    npm install
    ```

3.  Launch the Vite development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to the address displayed in the terminal (typically `http://localhost:5173`).

---

## 📂 Document-Oriented Storage Format

All details are stored in your workspace's `Projects/` directory. Here is an example of how a module file (`Projects/[Project_Name]/Modules/[Module_Name].txt`) is serialized:

```text
Module: Authentication Service

Notes:
Handles user login and signup.
Uses JWT tokens stored in cookies.
Database is PostgreSQL.

Threat Model:
Threat Name|STRIDE|Risk|Attack Scenario|Mitigation
Credential Stuffing|Spoofing|High|Attackers use automated lists of leaked credentials to attempt login.|Implement rate limiting and multi-factor authentication (MFA).
Session Hijacking|Elevation of Privilege|Medium|Intercepting JWT token allows impersonation of a target user.|Set HttpOnly, Secure, and SameSite flags on auth cookies.
```

---

## 🛠️ Tech Stack

*   **Backend:** [FastAPI](https://fastapi.tiangolo.com/), [Pydantic v2](https://docs.pydantic.dev/), [httpx](https://www.python-httpx.org/), [ReportLab](https://www.reportlab.com/) (PDF compilation)
*   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Vite](https://vite.dev/), [Lucide React](https://lucide.dev/) (Icons)
*   **AI Integration:** [OpenRouter API](https://openrouter.ai/)
