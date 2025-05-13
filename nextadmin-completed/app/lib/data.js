import {User, Models } from "./models";
import { connectToDB } from "./utils";

export const fetchUsers = async (q, page) => {
  const regex = new RegExp(q, "i");

  const ITEM_PER_PAGE = 8;

  try {
    connectToDB();
    const count = await User.find({ username: { $regex: regex } }).count();
    const users = await User.find({ username: { $regex: regex } })
      .limit(ITEM_PER_PAGE)
      .skip(ITEM_PER_PAGE * (page - 1));
    return { count, users };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to fetch users!");
  }
};

export const fetchUser = async (id) => {
  console.log(id);
  try {
    connectToDB();
    const user = await User.findById(id);
    return user;
  } catch (err) {
    console.log(err);
    throw new Error("Failed to fetch user!");
  }
};

export const fetchModels = async (q, page) => {
  const regex = new RegExp(q, "i");
  
  const ITEM_PER_PAGE = 8;

  try {
    connectToDB();
    
    const count = await Models.find({ title: { $regex: regex } }).count();
    const models = await Models.find({ title: { $regex: regex } })
      .limit(ITEM_PER_PAGE)
      .skip(ITEM_PER_PAGE * (page - 1));
    
    return { count, models };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to fetch models!");
  }
};

export const fetchModel = async (id) => {
  try {
    connectToDB();
    const model = await Models.findById(id);
    return model;
  }
  catch (err) {
    console.log(err);
    throw new Error("Failed to fetch model!");
  }
}

export const deleteModel = async (formData) => {
  const { id } = Object.fromEntries(formData);

  try {
    connectToDB();
    await Models.findByIdAndDelete(id);
  } catch (err) {
    console.log(err);
    throw new Error("Failed to delete model!");
  }
};

export const fetchTopModelsByAccuracy = async (limit = 5) => {
  try {
    connectToDB();
    const topModels = await Models.find({})
      .sort({ accuracy: -1 })
      .limit(limit)
      .select('title accuracy');
    
    return topModels.map(model => ({
      name: model.title,
      accuracy: model.accuracy
    }));
  } catch (err) {
    console.log(err);
    throw new Error("Failed to fetch top models!");
  }
};

export const fetchModelStats = async () => {
  try {
    connectToDB();
    const totalModels = await Models.countDocuments({});
    
    // Calculate average accuracy
    const models = await Models.find({});
    const totalAccuracy = models.reduce((sum, model) => sum + model.accuracy, 0);
    const avgAccuracy = totalModels > 0 ? (totalAccuracy / totalModels).toFixed(1) : 0;
    
    return { count: totalModels, avgAccuracy };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to fetch model statistics!");
  }
};

// This would ideally come from your actual database of recognizable people
// For now using a placeholder function
export const fetchRecognizablePeople = async () => {
  try {
    connectToDB();
    // Assuming you have a collection or way to count recognizable people
    // For now returning a fixed number as placeholder
    return { count: 1250 };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to fetch recognizable people count!");
  }
};

// This would ideally come from actual cloud metrics
// For now using a placeholder function
export const fetchCloudLatency = async () => {
  try {
    // In a real implementation, this would measure actual cloud latency
    // For now returning a fixed value as placeholder
    return { latency: 78, change: -5 }; // 78ms with 5% improvement
  } catch (err) {
    console.log(err);
    throw new Error("Failed to fetch cloud latency!");
  }
};

// Update the cards data to use the real data functions
export const fetchCardData = async () => {
  try {
    const modelStats = await fetchModelStats();
    const peopleStats = await fetchRecognizablePeople();
    const latencyStats = await fetchCloudLatency();
    
    return [
      {
        id: 1,
        title: "Total Models",
        number: modelStats.count,
        subText: `${modelStats.avgAccuracy}% avg accuracy`,
        change: 8,
        type: "models"
      },
      {
        id: 2,
        title: "Recognizable People",
        number: peopleStats.count,
        subText: "Unique identities",
        change: 13,
        type: "people"
      },
      {
        id: 3,
        title: "Cloud Latency",
        number: `${latencyStats.latency}ms`,
        subText: "Response time",
        change: latencyStats.change,
        type: "latency"
      },
    ];
  } catch (error) {
    console.error("Error fetching card data:", error);
    return [];
  }
};

// DUMMY DATA

export const cards = [
  {
    id: 1,
    title: "Total Users",
    number: 10.928,
    change: 12,
  },
  {
    id: 2,
    title: "Stock",
    number: 8.236,
    change: -2,
  },
  {
    id: 3,
    title: "Revenue",
    number: 6.642,
    change: 18,
  },
];