# 🚀 CoArchitect AI

### Turn diagrams into grounded architecture decisions

---

## 🌐 Live Demo

Primary domain:

👉 https://www.coarchitect.cloud/

Azure fallback:

👉 https://brave-smoke-025cfcd03.7.azurestaticapps.net/

## 🔗 Links

* **Try it:** https://www.coarchitect.cloud/
* **GitHub:** https://github.com/DIL8654/co-architect
* **Demo Video:** https://www.youtube.com/watch?v=hhnpsaK_KbU
* **Promo Video:** https://www.youtube.com/watch?v=CtzcO8Ju8z8
* **Product Promo + Demo:** https://youtu.be/36e67_7_3sc

---

## 🧠 What is CoArchitect AI?

CoArchitect AI is a **multi-agent architecture reasoning platform** that helps engineering teams:

* analyze architecture diagrams
* apply real-world standards
* understand trade-offs
* generate decision-ready Architecture Decision Records (ADRs)

Unlike traditional tools, CoArchitect **does not just generate output** — it shows **how decisions are made** through **transparent, multi-step AI reasoning**.

---

## ❗ Problem

Architecture reviews today are:

* manual and inconsistent
* hard to explain and justify
* disconnected from standards
* rarely documented as decisions

Teams struggle to move from:

```
diagram → insight → decision → documentation
```

---

## ✅ Solution

CoArchitect AI introduces a **structured reasoning workflow**:

```
Architecture Evidence → Multi-Agent Analysis → Grounded Insights → ADRs
```

It combines:

* 🧠 Multi-agent reasoning
* 📚 Standards & frameworks grounding
* ⚖️ Trade-off analysis
* 📊 Scoring & prioritization
* 📄 ADR generation with history

---

## 🤖 Multi-Agent Reasoning (Core Innovation)

CoArchitect orchestrates a **visible reasoning pipeline**:

1. Intake
2. Diagram Understanding
3. Framework Selection
4. Context Enrichment
5. Foundry IQ Retrieval
6. Foundry Expert
7. Specialist Agents
8. Trade-off Analysis
9. Scoring
10. ADR Generation
11. Verification
12. Recommendation Composition

👉 Each step is:

* visible in UI
* traceable
* explainable

This directly addresses **Reasoning & Multi-step Thinking (20%)**.

---

## 🧩 Foundry IQ Integration

CoArchitect uses a **Foundry IQ-style intelligence layer** to ground decisions in real-world standards.

### Grounding sources:

* Azure Well-Architected
* AWS Well-Architected
* ISO/IEC 25010
* ISO 27001
* OWASP ASVS
* GDPR, SOC 2
* TOGAF, SAFe
* Architecture principles & trade-offs
* Workspace memory

👉 Ensures:

* accurate reasoning
* explainable outputs
* enterprise relevance

---

## 📊 Key Features

* 🧱 Workspace → Diagram → Analysis → ADR workflow
* 📈 Architecture Intelligence Score (evidence-based)
* 🔍 Findings, recommendations, and risks
* ⚖️ Trade-off analysis (cost, performance, security)
* 🔄 Agent workflow visualization (pipeline-style)
* 📄 ADR generation with version history
* 📚 Knowledge base grounding (Foundry IQ)
* 🔁 Hybrid Foundry IQ retrieval with local knowledge-base fallback
* 🚀 Demo-ready seeded architecture scenarios
* 🛡️ Lightweight per-IP AI analysis rate limiting for the public MVP

---

## 🎬 Demo Walkthrough

Video walkthroughs:

* **Demo Video:** https://www.youtube.com/watch?v=hhnpsaK_KbU
* **Promo Video:** https://www.youtube.com/watch?v=CtzcO8Ju8z8
* **Product Promo + Demo:** https://youtu.be/36e67_7_3sc

### Quick Path (Recommended)

1. Open the live demo
2. Click **Try Now**
3. Select a demo architecture
4. Explore:

   * Architecture Intelligence Score
   * Agent Workflow
   * Findings & Recommendations
   * Trade-offs
   * ADRs

---

### Demo Scenarios

* 🎬 Automated Video Analysis Platform
* 📄 Custom Document Processing Platform
* 🏢 Enterprise SaaS Platform Baseline

---

## 🏗️ Architecture

* **Frontend:** React + TypeScript + Vite
* **Backend:** .NET 10 (Clean Architecture)
* **Storage:** TiDB + Azure Blob Storage
* **AI Layer:** Azure AI Foundry Agent Service
* **Fallback:** Mock provider and local Foundry IQ knowledge base (no Azure required)

📚 Docs:

* [System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)
* [Multi-Agent Reasoning](./docs/ai/MULTI_AGENT_REASONING.md)

---

## ⚙️ How It Works

1. Upload or select architecture
2. Define context & standards
3. Run AI analysis
4. Agents reason step-by-step
5. System generates:

   * score
   * findings
   * trade-offs
   * recommendations
6. ADRs are created automatically

### Foundry IQ runtime modes

CoArchitect now supports:

* **Local**: repo-backed `docs/knowledge-base/`
* **AzureFoundry**: managed Foundry IQ retrieval through a dedicated Foundry retrieval agent
* **Hybrid**: prefer managed Foundry IQ and fall back to the repo knowledge base automatically

The current stable hackathon default is **Local**. Managed Foundry IQ remains available as an explicit experimental upgrade path.

---

## 🧪 Assumptions (MVP Scope)

* No authentication (simplified for demo)
* Single-user flow
* Synthetic demo data
* Application-calculated scoring (not hallucinated by AI)
* Demo-first UX for fast evaluation
* Public AI analysis is limited per client IP to protect cost and availability
* Stable Azure mode uses API key plus a legacy agent endpoint instead of Managed Identity

---

## ⚠️ Limitations

### Product

* No auth / RBAC yet
* Limited collaboration
* Basic diagram parsing

### Performance

* Partial caching (not full production optimization)

### Security

* No production auth
* No audit logs
* Public MVP uses API-level analysis throttling instead of full edge security

### AI

* Application-led orchestration
* Limited evaluation coverage
* Hybrid multi-agent prompt-agent mode is optional and still experimental

---

## 🚀 Future Enhancements

* 🔐 Authentication (Frontegg / external IdP)
* 👥 Collaboration workflows
* 🧠 Advanced diagram parsing
* 📊 AI evaluation & benchmarking
* 🔎 Azure AI Search integration
* 📜 Audit & compliance tracking
* 🤖 Expanded agent specialization

---

## 🏆 Hackathon Alignment

This project directly addresses judging criteria:

* **Accuracy & Relevance** → Standards-based grounding
* **Reasoning & Multi-step Thinking** → Visible agent pipeline
* **Creativity** → Architecture reasoning as a product
* **UX & Presentation** → Clean, demo-ready workflows
* **Reliability & Safety** → Grounded AI + structured outputs

---

## ▶️ Run Locally

### Backend

```bash
cd backend
cp .env.example .env
docker compose up --build
```

### Frontend

```bash
cd web
npm install
npm run dev
```

Open:

* http://localhost:5173/
* http://localhost:5173/app

---

## 🧰 Tech Stack

* React, TypeScript, Vite
* .NET 10 (Clean Architecture)
* TiDB
* Azure Blob Storage
* Azure AI Foundry
* Tailwind-style UI

---

## 📚 Documentation

* [Docs Index](./docs/README.md)
* [User Journeys](./docs/product/USER_JOURNEYS.md)
* [UX Strategy](./docs/ux/UX_STRATEGY.md)

---

## 🎯 Final Note

CoArchitect AI transforms architecture reviews from **subjective discussions** into **structured, explainable, and decision-ready workflows**.

👉 Not just AI output — **AI reasoning you can trust.**
