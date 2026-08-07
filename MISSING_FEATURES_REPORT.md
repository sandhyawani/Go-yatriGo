# Missing Features Report

## 1. Missing Backend Controllers & Endpoints
**[🟠 High]**
The following models exist in the database schema but lack dedicated backend controllers, meaning their full CRUD lifecycle is either missing, incomplete, or hardcoded into other monolithic controllers:

- `FAQ` & `LegalContent`: No dedicated endpoints to manage platform FAQs or legal content dynamically.
- `SupportTicket` & `ReportProblem`: Missing complete lifecycle management (create, update status, resolve, delete).
- `Block`: Missing dedicated endpoint to manage blocklists.
- `JoinRequest` & `JourneyInvitation`: Lacking dedicated request management routes.
- `SavedPost`: Missing dedicated routes for users to save/unsave posts easily.
- `SecurityPreference` & `UserSettings`: Likely handled inline, but lack standalone robust configuration routes.

## 2. Missing Frontend Features & UI
**[🟠 High]**
Based on the backend models and available frontend files, the following UI flows are either missing or underdeveloped:
- **Comprehensive Admin Dashboard**: While `Admin.jsx` exists, managing `ReportProblem`, `FAQ`, and `LegalContent` likely lacks complete UI views.
- **Granular Notification Settings**: The `Notification` model exists, but UI for configuring push/email notification preferences per user is likely missing or incomplete.
- **Support & Ticketing UI**: Missing a robust user-facing dashboard for tracking the status of their `SupportTicket`s.

## 3. Missing Reusable Components
**[🟡 Medium]**
The frontend lacks a dedicated component library, meaning the following standard elements are missing as reusable components:
- `<EmptyState />`: For when lists (journeys, friends, posts) are empty.
- `<SkeletonLoader />`: For loading states instead of generic spinners.
- `<ErrorBoundary />`: To gracefully handle UI crashes.
- `<ConfirmationDialog />`: A generic reusable modal for destructive actions (e.g., deleting a post or journey).
