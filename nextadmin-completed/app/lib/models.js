import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      min: 3,
      max: 20,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      select: true
    },
    img: {
      type: String,
      default: null
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    phone: {
      type: String,
      default: null,
      trim: true
    },
    address: {
      type: String,
      default: null,
      trim: true
    },
    embeddings: {
      type: [Number], // or whatever type your embeddings are
      default: null
    },
    faceId: {
      type: String,
      unique: true,
      sparse: true,
      default: null
    }
  },
  { timestamps: true }
);
// Add a debug method to show all fields including password
userSchema.methods.toDebugJSON = function() {
  const obj = this.toObject();
  return obj;
};

const modelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    desc: {
      type: String,
      required: true,
    },
    cat: {
      type: String,
      required: true,
    },
    img: {
      type: String,
    },
    color: {
      type: String,
    },
    size: {
      type: Number,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0,
    },
    edgeDevice: {
      type: String,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Models = mongoose.models.Models || mongoose.model("Models", modelSchema);
