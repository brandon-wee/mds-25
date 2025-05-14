"use client";

import Image from "next/image";
import MenuLink from "./menuLink/menuLink";
import styles from "./sidebar.module.css";
import {
  MdDashboard,
  MdSupervisedUserCircle,
  MdWork,
  MdAnalytics,
  MdPeople,
  MdOutlineSettings,
  MdHelpCenter,
  MdLogout,
  MdOutlineCategory,
  MdFace,
} from "react-icons/md";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "Pages",
    list: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: <MdDashboard />,
      },
      {
        title: "Users",
        path: "/dashboard/users",
        icon: <MdSupervisedUserCircle />,
      },
      {
        title: "Models",
        path: "/dashboard/models",
        icon: <MdOutlineCategory />,
      },
    ],
  },
  {
    title: "Analytics",
    list: [
      {
        title: "Real-time Data",
        path: "/dashboard/analytics/realtime",
        icon: <MdAnalytics />,
      },
      {
        title: "Edge Devices",
        path: "/dashboard/analytics/edge",
        icon: <MdWork />,
      },
    ],
  },
  {
    title: "People",
    list: [
      {
        title: "People",
        path: "/dashboard/people",
        icon: <MdPeople />,
      },
      {
        title: "Embeddings",
        path: "/dashboard/embeddings",
        icon: <MdFace />,
      },
    ],
  },
  {
    title: "User",
    list: [
      {
        title: "Settings",
        path: "/dashboard/settings",
        icon: <MdOutlineSettings />,
      },
      {
        title: "Help",
        path: "/dashboard/help",
        icon: <MdHelpCenter />,
      },
    ],
  },
];

const Sidebar = () => {
  const router = useRouter();
  const [user, setUser] = useState({
    username: "Admin User",
    img: null
  });
  
  // Simple logout handler
  const handleLogout = () => {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };
  
  // Try to parse user info from cookie on client side
  useEffect(() => {
    try {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
      
      if (authCookie) {
        const token = authCookie.split('=')[1];
        const decoded = JSON.parse(atob(token));
        
        if (decoded && decoded.username) {
          setUser({
            username: decoded.username,
            img: decoded.img || null
          });
        }
      }
    } catch (error) {
      console.error("Error parsing user from cookie:", error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.user}>
        <Image
          className={styles.userImage}
          src={user?.img || "/noavatar.png"}
          alt=""
          width="50"
          height="50"
        />
        <div className={styles.userDetail}>
          <span className={styles.username}>{user?.username}</span>
          <span className={styles.userTitle}>Administrator</span>
        </div>
      </div>
      <ul className={styles.list}>
        {menuItems.map((cat) => (
          <li key={cat.title}>
            <span className={styles.cat}>{cat.title}</span>
            {cat.list.map((item) => (
              <MenuLink item={item} key={item.title} />
            ))}
          </li>
        ))}
      </ul>
      <button onClick={handleLogout} className={styles.logout}>
        <MdLogout />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;