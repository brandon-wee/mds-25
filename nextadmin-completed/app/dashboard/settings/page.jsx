import styles from "@/app/ui/dashboard/settings/settings.module.css";

const SettingsPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <button className={styles.saveButton}>Save Changes</button>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2>Account Settings</h2>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input type="email" defaultValue="user@example.com" />
          </div>
          <div className={styles.formGroup}>
            <label>Username</label>
            <input type="text" defaultValue="admin" />
          </div>
          <div className={styles.formGroup}>
            <label>Change Password</label>
            <input type="password" placeholder="Enter new password" />
          </div>
        </div>

        <div className={styles.section}>
          <h2>Preferences</h2>
          <div className={styles.formGroup}>
            <label>Theme</label>
            <select defaultValue="system">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Notifications</label>
            <div className={styles.checkboxGroup}>
              <div className={styles.checkbox}>
                <input type="checkbox" id="email-notifications" defaultChecked />
                <label htmlFor="email-notifications">Email Notifications</label>
              </div>
              <div className={styles.checkbox}>
                <input type="checkbox" id="alert-notifications" defaultChecked />
                <label htmlFor="alert-notifications">System Alerts</label>
              </div>
              <div className={styles.checkbox}>
                <input type="checkbox" id="update-notifications" />
                <label htmlFor="update-notifications">Update Notifications</label>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>API Access</h2>
          <div className={styles.formGroup}>
            <label>API Key</label>
            <div className={styles.apiKeyGroup}>
              <input type="text" value="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" readOnly />
              <button className={styles.generateButton}>Generate New</button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Webhook URL</label>
            <input type="url" placeholder="https://your-webhook-endpoint.com" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
