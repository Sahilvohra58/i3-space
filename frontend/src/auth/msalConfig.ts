import { type Configuration, PublicClientApplication } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: "0b7fb923-f379-4245-b319-a9c1725af4f5",
    authority: "https://login.microsoftonline.com/d1aec0dc-1c2b-4541-9724-3a6f21519d9e",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
