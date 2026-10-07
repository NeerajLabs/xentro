# XENTRO — Complete System Architecture & Operations Manual

> **"Connect People. Create Opportunity."**  
> Complete project manual and architectural reference for the XENTRO ecosystem.

*Refer to [`README.md`](file:///c:/Users/LENOVO/Desktop/XentroV0.911%20-%20Copy/NewPro/README.md) for the master documentation covering:*
1. **Platform Vision & Core Personas**: Startups, Mentors, Investors, Ecosystem Service Providers, Administrators.
2. **Technology Stack**: Next.js 14.2 App Router, TypeScript 5, TailwindCSS 3.4, Lucide React.
3. **Real-Time Communication Engine**: Self-hosted Server-Sent Events (SSE) `/api/messages/stream` + `BroadcastChannel` (cross-tab 0ms) + Persistent disk/memory store.
4. **Connection Flow Lifecycle**: `None` $\rightarrow$ `Pending` $\rightarrow$ `Received` $\rightarrow$ `Connected` with real-time notifications, red dot badges, and automated chat kick-off messages.
5. **Role Dashboards & Workspaces**: Comprehensive workspaces for Startups (Traction, Team, Asks), Mentors (Offerings, Meeting Slots), Investors (Deal Flow, DD Locker Requests), ESPs (Programs, Grants), and Admins (KYC, Verification).
6. **Virtual Data Rooms & Profile Views**: Interactive pitch deck viewer, video elevator pitch, DD locker security tiers, and mentor booking engine.
7. **Directory Map & File Manifest**: Complete file locations, roles, and exports across `app/`, `components/`, `data/`, `lib/`, and `types/`.
8. **API Contracts**: Specifications for `/api/messages`, `/api/connections`, and `/api/messages/stream`.
9. **Verification Suite**: 8/8 automated integration tests passed, 0 TypeScript errors, successful Next.js build.
10. **Execution Guide**: Local development, multi-laptop Wi-Fi pairing (`0.0.0.0`), and zero-config production deployment.

---

### Key File Locations:
* **Master Documentation**: [`README.md`](file:///c:/Users/LENOVO/Desktop/XentroV0.911%20-%20Copy/NewPro/README.md)
* **Session Verification & Audit Backup**: [`BAK-work.md`](file:///c:/Users/LENOVO/Desktop/XentroV0.911%20-%20Copy/NewPro/BAK-work.md)
* **Real-time Server State**: [`lib/serverMessages.ts`](file:///c:/Users/LENOVO/Desktop/XentroV0.911%20-%20Copy/NewPro/lib/serverMessages.ts)
* **Client Real-time Messaging**: [`lib/messagingService.ts`](file:///c:/Users/LENOVO/Desktop/XentroV0.911%20-%20Copy/NewPro/lib/messagingService.ts)
* **Client Connection Service**: [`lib/connectionService.ts`](file:///c:/Users/LENOVO/Desktop/XentroV0.911%20-%20Copy/NewPro/lib/connectionService.ts)
