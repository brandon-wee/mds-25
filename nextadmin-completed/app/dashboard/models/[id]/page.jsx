import { updateModel } from "@/app/lib/actions"
import { fetchModel } from "@/app/lib/data"
import styles from "@/app/ui/dashboard/models/singleModel/singleModel.module.css"
import Image from "next/image"

const SingleModelPage = async ({ params }) => {
  const { id } = params
  const model = await fetchModel(id)

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.imgContainer}>
          <Image src="/noavatar.png" alt="" fill />
        </div>
        <h1 className={styles.title}>{model.title}</h1>
        <div className={styles.detail}>
          <span className={styles.detailTitle}>Category:</span>
          <span className={styles.detailValue}>{model.cat}</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailTitle}>Accuracy:</span>
          <span className={styles.detailValue}>{model.accuracy}%</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailTitle}>Response Time:</span>
          <span className={styles.detailValue}>{model.responseTime} ms</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailTitle}>Edge Device:</span>
          <span className={styles.detailValue}>{model.edgeDevice}</span>
        </div>
      </div>
      
      <div className={styles.formContainer}>
        <form action={updateModel} className={styles.form}>
          <input type="hidden" name="id" value={model.id} />
          
          <label>Title</label>
          <input 
            type="text" 
            name="title" 
            placeholder={model.title}
            required
          />
          
          <label>Category</label>
          <select name="cat" required>
            <option value="">Select a category</option>
            <option value="base" selected={model.cat === "base"}>Base</option>
            <option value="distilled" selected={model.cat === "distilled"}>Distilled</option>
            <option value="quantized" selected={model.cat === "quantized"}>Quantized</option>
            <option value="distilled2" selected={model.cat === "distilled2"}>Distilled-Quantized</option>
          </select>
          
          <label>Accuracy (%)</label>
          <input 
            type="number" 
            name="accuracy" 
            placeholder={model.accuracy}
            step="0.01"
            min="0"
            max="100"
            required
          />
          
          <label>Response Time (ms)</label>
          <input
            type="number"
            name="responseTime"
            placeholder={model.responseTime}
            min="0"
            required
          />
          
          <label>Size (MB)</label>
          <input
            type="number"
            name="size"
            placeholder={model.size}
            min="0"
            required
          />
          
          <label>Edge Device</label>
          <select name="edgeDevice" required>
            <option value="">Select an edge device</option>
            <option value="nicla" selected={model.edgeDevice === "nicla"}>Nicla Arduino</option>
            <option value="raspberry" selected={model.edgeDevice === "raspberry"}>Raspberry Pi Model B</option>
          </select>
          
          <label>Description</label>
          <textarea 
            name="desc" 
            rows="10" 
            placeholder={model.desc}
            required
          ></textarea>
          
          <button className={styles.updateButton}>Update</button>
        </form>
      </div>
    </div>
  )
}

export default SingleModelPage