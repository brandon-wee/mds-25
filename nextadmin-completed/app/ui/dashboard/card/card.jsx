import { MdSupervisedUserCircle, MdCategory, MdPeopleAlt, MdCloudQueue } from "react-icons/md";
import styles from "./card.module.css";

const Card = ({ item }) => {
  // Select icon based on card type
  const getIcon = () => {
    switch (item.type) {
      case "models":
        return <MdCategory size={24} />;
      case "people":
        return <MdPeopleAlt size={24} />;
      case "latency":
        return <MdCloudQueue size={24} />;
      default:
        return <MdSupervisedUserCircle size={24} />;
    }
  };

  return (
    <div className={styles.container}>
      {getIcon()}
      <div className={styles.texts}>
        <span className={styles.title}>{item.title}</span>
        <span className={styles.number}>{item.number}</span>
        {item.subText && <span className={styles.subText}>{item.subText}</span>}
      </div>
    </div>
  );
};

export default Card;
