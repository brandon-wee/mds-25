import styles from "@/app/ui/dashboard/people/people.module.css";
import Image from "next/image";

const PeoplePage = () => {
  // Sample people data
  const people = [
    { id: 1, name: "John Doe", role: "Developer", team: "Engineering", image: "/noavatar.png" },
    { id: 2, name: "Jane Smith", role: "Designer", team: "Design", image: "/noavatar.png" },
    { id: 3, name: "Mike Johnson", role: "Product Manager", team: "Product", image: "/noavatar.png" },
    { id: 4, name: "Sarah Brown", role: "Data Scientist", team: "Data", image: "/noavatar.png" },
    { id: 5, name: "Tom Wilson", role: "DevOps Engineer", team: "Engineering", image: "/noavatar.png" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>People Directory</h1>
        <button className={styles.addButton}>Add Person</button>
      </div>

      <div className={styles.filters}>
        <select className={styles.filter}>
          <option value="">All Teams</option>
          <option value="engineering">Engineering</option>
          <option value="design">Design</option>
          <option value="product">Product</option>
          <option value="data">Data</option>
        </select>

        <div className={styles.search}>
          <input type="text" placeholder="Search people..." />
          <button>Search</button>
        </div>
      </div>

      <div className={styles.peopleGrid}>
        {people.map((person) => (
          <div key={person.id} className={styles.personCard}>
            <div className={styles.personImage}>
              <Image
                src={person.image}
                alt={person.name}
                width={80}
                height={80}
              />
            </div>
            <div className={styles.personInfo}>
              <h3>{person.name}</h3>
              <p className={styles.role}>{person.role}</p>
              <p className={styles.team}>{person.team}</p>
            </div>
            <div className={styles.personActions}>
              <button className={styles.viewButton}>View Profile</button>
              <button className={styles.messageButton}>Message</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeoplePage;
