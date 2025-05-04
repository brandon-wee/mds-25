import { addModel } from "@/app/lib/actions"
import styles from "@/app/ui/dashboard/models/addModel/addModel.module.css"

const AddModelPage = () => {
  return (
    <div className={styles.container}>
      <form action={addModel} className={styles.form}>
      <input type="text" placeholder="title" name="title" required />
        <select name="cat">
          <option value="general">Choose a Model Category</option>
          <option value="base">Base</option>
          <option value="distilled">Distilled</option>
          <option value="quantized">Quantized</option>
          <option value="distilled2">Distilled-Quantized</option>
        </select>
        <input 
          type="number" 
          placeholder="Accuracy (%)"
          name="accuracy"
          step="0.01" 
          min="0"
          max="100"
          required
        />
        <input
          type="number"
          placeholder="Response Time (ms)"
          name="responseTime"
          required
        />
        <input
          type="number"
          placeholder="Size (MB)"
          name="size"
          required
        />
        <select name="edgeDevice">
          <option value="">Choose Edge Device</option>
          <option value="nicla">Nicla Arduino</option>
          <option value="raspberry">Raspberry Pi Model B</option>
        </select>
        <textarea
          required
          name="desc"
          id="desc"
          rows="16"
          placeholder="Description"
        ></textarea>
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default AddModelPage