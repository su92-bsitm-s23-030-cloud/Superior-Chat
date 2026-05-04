# Login Page Changes TODO

## Overview
Modify the login screen to include:
1. Top section: Username (email) and password registration/login
   - Allow any @superior.edu.pk email to register
   - Password is fixed as "superior123" for everyone
2. Bottom section: Google account login
   - Allow any @superior.edu.pk email to login via Google

## Tasks
- [ ] Add google_sign_in dependency to pubspec.yaml
- [ ] Update login_screen.dart UI with two sections
- [ ] Modify auth_provider.dart to handle registration and Google login
- [ ] Update api_service.dart with new endpoints for registration and Google login
- [ ] Modify backend/server.js to support registration and password/Google login
- [ ] Test login functionality

## Files to Edit
- pubspec.yaml
- lib/screens/login_screen.dart
- lib/providers/auth_provider.dart
- lib/services/api_service.dart
- backend/server.js

## Followup Steps
- Test username/password registration and login
- Test Google login with @superior.edu.pk emails
- Verify backend handles new users correctly
