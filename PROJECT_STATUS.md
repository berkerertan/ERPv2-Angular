# StokNet Project Status

Last updated: 2026-05-01

## Repo layout
- Backend/API repo: `C:\Users\User\Documents\ERPv2`
- Frontend/Angular repo: `C:\Users\User\Documents\ERPv2 Angular`
- Azure App Service serves the API.
- Vercel serves the Angular frontend.

## Frontend source of truth
- This Angular repo is the real frontend source.
- Backend `wwwroot` files are not the primary place for feature development.

## Synced features expected here
- Barcode-assisted inventory counting
- Inventory count session UI:
  - start session
  - open sessions
  - resume session
- Inventory count history UI:
  - difference summary
  - completed session history
  - session detail modal
  - item-level location and operator trace
- Purchase recommendations UI
- Real notification center
- Buyer risk notifications
- Landing/demo CTA flow
- Demo login without showing demo credentials in visible fields

## Current staged roadmap
1. Session start / open / resume
2. Difference summary + session history
3. Shelf/location visibility + operator trace
4. Mobile UX tightening

## Next backlog
1. Buyer risk badges on buyer screens
2. Approval timeline improvements
3. Supplier lead-time support in purchase recommendations
4. Better mobile barcode batching
