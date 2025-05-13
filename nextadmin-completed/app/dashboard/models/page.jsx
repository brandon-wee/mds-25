import Image from "next/image";
import Link from "next/link";
import styles from "@/app/ui/dashboard/models/models.module.css"; 
import Search from "@/app/ui/dashboard/search/search";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import { fetchModels } from "@/app/lib/data";
import { deleteModel } from "@/app/lib/actions";

const ModelsPage = async ({ searchParams }) => {
  const q = searchParams?.q || "";
  const page = searchParams?.page || 1;
  const { count, models } = await fetchModels(q, page);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a model..." />
        <Link href="/dashboard/models/add">
          <button className={styles.addButton}>Add New</button>
        </Link>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <td>Title</td>
            <td>Description</td>
            <td>Accuracy</td>
            <td>Response Time</td>
            <td>Edge Device</td>
            <td>Size</td>
            <td>Action</td>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.id}>              <td>
                <div className={styles.product}>
                  <Image
                    src={model.edgeDevice === "nicla" ? "/arduino-icon.png" : "/raspberry-icon.png"}
                    alt={model.edgeDevice === "nicla" ? "Arduino Nicla" : "Raspberry Pi"}
                    width={40}
                    height={40}
                    className={styles.productImage}
                  />
                  {model.title}
                </div>
              </td>
              <td>{model.desc}</td>
              <td>{model.accuracy}%</td>
              <td>{model.responseTime} ms</td>
              <td>{model.edgeDevice}</td>
              <td>{model.size}</td>
              <td>
                <div className={styles.buttons}>
                  <Link href={`/dashboard/models/${model.id}`}>
                    <button className={`${styles.button} ${styles.view}`}>
                      View
                    </button>
                  </Link>
                  <form action={deleteModel}>
                    <input type="hidden" name="id" value={model.id} />
                    <button className={`${styles.button} ${styles.delete}`}>
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination count={count} />
    </div>
  );
};

export default ModelsPage;