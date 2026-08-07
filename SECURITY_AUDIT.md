# Security Audit

## 1. Authentication & Authorization
**[🟡 Medium]**
- **Token Validation**: The application uses JWT for authentication (`verifyToken` middleware). However, the socket authentication manually verifies the token instead of using a unified service. 
- **Role Checks**: There is an `adminRoutes.js` and `adminController.js`, but it's crucial to verify if all sensitive administrative endpoints properly validate the user's role (`role === 'admin'`).
- **Suspension Checks**: The `checkSuspended` middleware is used in some routes (`postRoutes.js`) but needs to be systematically applied to ALL authenticated routes to prevent suspended users from performing actions.

## 2. Injection & XSS Protection
**[🟢 Low]**
- **Implementation**: The backend correctly utilizes `express-mongo-sanitize` to prevent NoSQL injection, and `xss-clean` to sanitize user input.
- **Recommendation**: Ensure that all rich text inputs (e.g., comments, posts, stories) are safely rendered on the frontend using proper escaping, to prevent stored XSS attacks if backend sanitization fails or is bypassed.

## 3. Rate Limiting
**[🟢 Low]**
- **Implementation**: `express-rate-limit` is configured for both auth endpoints (`authLimiter`) and general API endpoints (`apiLimiter`).
- **Recommendation**: Ensure the rate limits (30 requests/15 min for auth, 300 requests/15 min for API) align with expected user behavior. Consider adding stricter rate limits for specific high-risk endpoints like password resets or email verifications.

## 4. File Uploads
**[🔴 Critical]**
- **Implementation**: The `uploadRoute.js` handles file uploads. 
- **Vulnerability**: If file types and sizes are not strictly validated, attackers could upload malicious scripts or oversized files causing Denial of Service (DoS) or Remote Code Execution (RCE).
- **Recommendation**: Ensure `multer` or the upload mechanism strictly filters for specific MIME types (e.g., `image/jpeg`, `image/png`) and enforces hard size limits before the file is parsed into memory or saved to disk.

## 5. Privacy & Data Exposure
**[🟠 High]**
- **Implementation**: User profiles and posts are fetched via API.
- **Vulnerability**: Ensure that sensitive fields like `password`, `email` (if private), `resetToken`, etc., are explicitly excluded (`.select("-password")`) in ALL queries returning user data. The socket authentication does this, but it must be verified across all controllers.
