# Security Specification: Clinic Management System

## Data Invariants
1.  **Branch Isolation**: All records (patients, appointments, etc.) MUST belong to a valid `branchId`. Users can only access records of their assigned branch, unless they are `super_admin`.
2.  **User Role Security**: Users cannot modify their own `role` or `branchId`.
3.  **Appointment Integrity**: Appointments must have a valid patient, doctor, and branch.
4.  **Terminal State**: Appointments with `status: 'completed'` or `'cancelled'` are immutable.

## The "Dirty Dozen" Payloads (Examples)
1.  **Unauthorized Branch Access**: `POST /patients` with `branchId` that user is not assigned to.
2.  **Role Escalation**: `PATCH /users/{uid}` with `role: 'super_admin'`.
3.  **Illegal Appointment Update**: `PATCH /appointments/{appId}` changing `patientId` after creation.
4.  **Terminal Status Update**: `PATCH /appointments/{appId}` with `status: 'pending'` when current is `'completed'`.
5.  **Invalid ID Poisoning**: `GET /patients/{"$ne": null}`.
6.  **Orphaned Expense**: `POST /expenses` without a valid `branchId`.
7.  **System Field Tampering**: `PATCH /whatsappLogs/{logId}` modifying `sentAt` field by a user.
8.  **PII Leak**: `GET /patients/{patientId}` by a user assigned to a different branch.
9.  **Negative Amount**: `POST /treatments` with `price: -100`.
10. **Shadow Field Injection**: `POST /patients` with `isVerified: true`.
11. **Spoofed Admin Request**: `PATCH /users/{uid}` with email `admin@clinic.com` but `email_verified: false`.
12. **Recursive List Attack**: `LIST /patients` without filtering by `branchId`.

## Test Plan (`firestore.rules.test.ts` placeholder)
*   Tests will use Firebase Emulator to verify that all the above 12 scenarios are rejected with `PERMISSION_DENIED`.
