# StokNet Project Status

Last updated: 2026-05-03

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
- Inventory count sessions, history and mobile quick-count UX
- Purchase recommendations UI
- Recommendation supplier grouping and split-to-draft flow
- Real notification center
- Buyer risk notifications and buyer risk screen
- Purchase/sales order approval flow UI
- Supplier lead-time field on supplier forms/list
- Landing/demo CTA flow
- Demo login without showing demo credentials in visible fields

## Current staged roadmap
1. Session start / open / resume
2. Difference summary + session history
3. Shelf/location visibility + operator trace
4. Buyer risk screen
5. Approval timeline + rejection flow
6. Mobile counting UX tightening
7. Purchase recommendations 2.0

## Next backlog
1. Better multi-supplier recommendation refinement
2. Richer approval timeline polish
3. Offline queue and delayed sync

