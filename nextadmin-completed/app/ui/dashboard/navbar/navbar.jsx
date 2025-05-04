"use client";
import { usePathname } from "next/navigation";
import styles from "./navbar.module.css";
import {
  MdNotifications,
  MdOutlineChat,
  MdPublic,
  MdSearch,
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdClose,
} from "react-icons/md";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useNotifications } from "@/app/contexts/NotificationContext";
import { useState, useEffect } from "react";


const Navbar = () => {
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useTheme();
  const { notifications, removeNotification } = useNotifications();
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Use useEffect to verify the theme state when component mounts
  useEffect(() => {
    console.log("Current theme:", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
  };
  
  // Enhanced theme toggle with feedback
  const handleThemeToggle = () => {
    console.log("Theme toggle clicked, changing from", isDarkMode ? "dark" : "light");
    toggleTheme();
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{pathname.split("/").pop()}</div>
      <div className={styles.menu}>
        <div className={styles.search}>
          <MdSearch />
          <input 
            type="text" 
            placeholder="Search..." 
            className={styles.input} 
            value={searchValue}
            onChange={handleSearch}
            aria-label="Search dashboard"
          />
        </div>
        <div className={styles.icons}>
          <div style={{ position: "relative" }}>
            <MdOutlineChat size={20} title="Messages" />
          </div>
          <div style={{ position: "relative" }}>
            <MdNotifications 
              size={20} 
              title="Notifications" 
              onClick={() => setIsNotificationsPanelOpen(!isNotificationsPanelOpen)}
            />
            {notifications.length > 0 && (
              <span className={styles.badge}>
                {notifications.length}
              </span>
            )}
            {isNotificationsPanelOpen && (
              <div className={styles.notificationsPanel}>
                <h3>Notifications</h3>
                {notifications.map((notif) => (
                  <div key={notif.id} className={styles.notification}>
                    <p>{notif.message}</p>
                    <small>{new Date(notif.timestamp).toLocaleTimeString()}</small>
                    <MdClose 
                      onClick={() => removeNotification(notif.id)}
                      className={styles.closeNotif}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <MdPublic size={20} title="Language" />
          <div className={styles.themeToggle}>
            {isDarkMode ? (
              <MdOutlineLightMode 
                size={20} 
                onClick={handleThemeToggle} 
                title="Switch to light mode" 
                className={styles.themeIcon}
              />
            ) : (
              <MdOutlineDarkMode 
                size={20} 
                onClick={handleThemeToggle} 
                title="Switch to dark mode" 
                className={styles.themeIcon}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
