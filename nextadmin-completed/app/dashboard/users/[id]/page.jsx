import { updateUser } from "@/app/lib/actions";
import { fetchUser } from "@/app/lib/data";
import styles from "@/app/ui/dashboard/users/singleUser/singleUser.module.css";
import Image from "next/image";
import { connectToDB } from "@/app/lib/utils";
import { User } from "@/app/lib/models";
import EmbeddingUpdate from "@/app/ui/dashboard/embeddings/embeddingUpdate";

// Helper function to serialize MongoDB document
function serializeUser(user) {
  if (!user) return null;
  
  const serialized = {};
  
  // Convert MongoDB document to plain object if needed
  const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
  
  // Copy all properties
  Object.keys(userObj).forEach(key => {
    serialized[key] = userObj[key];
  });
  
  // Ensure ID is properly serialized
  if (userObj._id) {
    serialized.id = userObj._id.toString();
  }
  
  // Convert dates to strings
  if (userObj.createdAt instanceof Date) {
    serialized.createdAt = userObj.createdAt.toISOString();
  }
  if (userObj.updatedAt instanceof Date) {
    serialized.updatedAt = userObj.updatedAt.toISOString();
  }
  
  console.log("User serialized:", serialized.id, serialized.username);
  
  return serialized;
}

// This is a server component
const SingleUserPage = async ({ params }) => {
  
  const { id } = params;
  const user = await fetchUser(id);
  
  await connectToDB();
  
  // Fetch user data
  const userData = await User.findById(id);
  
  // Serialize the user data to remove Mongoose-specific properties
  const serializedUser = serializeUser(userData);

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.imgContainer}>
          <Image src={user.img || "/noavatar.png"} alt="" fill />
        </div>
        {user.username}
      </div>
      <div className={styles.formContainer}>
        <form action={updateUser} className={styles.form}>
          <input type="hidden" name="id" value={user.id}/>
          <label>Username</label>
          <input type="text" name="username" placeholder={user.username} />
          <label>Email</label>
          <input type="email" name="email" placeholder={user.email} />
          <label>Password</label>
          <input type="password" name="password" />
          <label>Phone</label>
          <input type="text" name="phone" placeholder={user.phone} />
          <label>Address</label>
          <textarea type="text" name="address" placeholder={user.address} />
          <label>Is Admin?</label>
          <select name="isAdmin" id="isAdmin">
            <option value={true} selected={user.isAdmin}>Yes</option>
            <option value={false} selected={!user.isAdmin}>No</option>
          </select>
          <label>Is Active?</label>
          <select name="isActive" id="isActive">
            <option value={true} selected={user.isActive}>Yes</option>
            <option value={false} selected={!user.isActive}>No</option>
          </select>
          <button>Update</button>
        </form>
      </div>
    </div>
  );
};

export default SingleUserPage;
