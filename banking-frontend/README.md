# NovaBank Frontend

A modern banking frontend for the Spring Boot banking backend.

## Run
Open `index.html` with VS Code Live Server, or run:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Backend
Default API URL:
`http://localhost:8081`

Edit `js/config.js` if your backend uses another port.

## Login
This frontend includes a polished demo login screen. The demo login redirects to the dashboard without requiring Keycloak.

For production, replace the demo login in `js/login.js` with your Keycloak OIDC flow and send the resulting JWT in the `Authorization: Bearer <token>` header.

## Included UI
- Responsive login page
- Banking dashboard
- Account cards
- Transfer form
- Transaction history
- Beneficiary management
- Mobile sidebar
- Toast notifications
- API helper functions for Spring Boot
