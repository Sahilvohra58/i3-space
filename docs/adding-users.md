# Adding Users to i3 Space

Access to [i3-space.pages.dev](https://i3-space.pages.dev) is controlled through the **i3space-app** Enterprise Application in Azure AD. Only users you explicitly add can sign in — everyone else gets blocked by Microsoft before reaching the app.

---

## Step 1 — One-time setup (done ✓)

Mujtaba (Global Admin) has approved the app for the i3 Institute tenant. This step does not need to be repeated.

---

## Step 2 — Adding a user (Sahil can do this anytime)

1. Open [Azure Portal → Enterprise Applications → i3space-app → Users and groups](https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Users/objectId/caf970ac-5dd7-42be-a400-06e6c577bf51/appId/0b7fb923-f379-4245-b319-a9c1725af4f5/preferredSingleSignOnMode~/null)
2. Click **Add user/group**
3. Search by name or email → select the person → click **Assign**

The user can now sign in immediately — no further steps needed.

## Removing a user

1. Go to the same [Users and groups](https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Users/objectId/caf970ac-5dd7-42be-a400-06e6c577bf51/appId/0b7fb923-f379-4245-b319-a9c1725af4f5/preferredSingleSignOnMode~/null) page
2. Check the box next to the user → click **Remove**

Their access is revoked immediately.

---

## How it works

- **Assignment required** is turned on, so only users on this list can sign in
- Anyone not on the list gets a Microsoft "you don't have access" page — they never reach the app
- Users sign in with their existing i3 Institute Microsoft account — no separate password needed
