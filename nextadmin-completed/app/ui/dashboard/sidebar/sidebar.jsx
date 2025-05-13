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
import { auth } from "@/app/auth"; // Removed signOut import as we're not using it

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
      {
        title: "Logout",
        path: "/login", // Navigate to login page instead
        icon: <MdLogout />,
      },
    ],
  },
];

const Sidebar = async () => {
  const { user } = await auth();
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
      {/* Server-side logout action commented out
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button className={styles.logout}>
          <MdLogout />
          Logout
        </button>
      </form>
      */}
    </div>
  );
};

export default Sidebar;