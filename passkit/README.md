TapInk Apple Wallet pass template lives in `passkit/template`. The API at `/api/wallet-pass` loads this template, replaces the fields with your profile data, and then signs it with your Apple certificates.

Environment variables required:
- `PASSKIT_CERT_P12_PATH`: Absolute path to your signing `.p12` (or PEM) file.
- `PASSKIT_CERT_PASSWORD`: Password for the signing key.
- `PASSKIT_WWDR_CERT_PATH`: Absolute path to the Apple WWDR/WWDR-G3 certificate in PEM format.
- `PASSKIT_TEAM_IDENTIFIER`: Your Apple team ID (e.g., ABC1234DEF).
- `PASSKIT_PASS_TYPE_IDENTIFIER`: Your pass type identifier (e.g., pass.com.company.app).
- `PASSKIT_ORGANIZATION_NAME`: Displayed on the pass.

The template bundles default icons and strip artwork. At runtime the API will swap in:
- Name, company, title, profile URL (for the QR), and profile ID (serial).
- Colours from the design screen.
- User banner (strip image) and logo (logo.png) if provided; otherwise the defaults in `passkit/template` are used.

After setting the env vars and adding your certificates, trigger a download from the Design tab (step 3). The request uses the same payload that powers the on-screen pass preview, so what you see is what you sign.
