import express from "express";
import { pipeline, RawImage } from "@xenova/transformers";

const app = express();
app.use(express.json());

console.log("⏳ Initializing AI Models...");

// 1. Vision Model
const classifierPromise = pipeline(
  "zero-shot-image-classification",
  "Xenova/clip-vit-base-patch32",
  {
    progress_callback: (data) => {
      // Log progress for the Vision Model
      if (data.status === 'progress') {
        console.log(`📷 Loading Vision Model [${data.file}]: ${Math.round(data.progress)}%`);
      }
    }
  }
);

// 2. Vision Feature Extractor
const extractorPromise = pipeline(
  "image-feature-extraction", 
  "Xenova/clip-vit-base-patch32"
);

// 3. Text Model
const textClassifierPromise = pipeline(
  "zero-shot-classification",
  "Xenova/mobilebert-uncased-mnli",
  {
    progress_callback: (data) => {
      // Log progress for the Text Model
      if (data.status === 'initiate') {
        console.log(`📥 Downloading ${data.file}...`);
      }
      if (data.status === 'progress') {
        console.log(`📝 Loading Text Model [${data.file}]: ${Math.round(data.progress)}%`);
      }
      if (data.status === 'done') {
        console.log(`✅ Loaded ${data.file}`);
      }
    }
  }
);

// Wait for models to load immediately so we know if they fail
Promise.all([classifierPromise, textClassifierPromise])
  .then(() => console.log("🤖 ALL AI MODELS READY!"))
  .catch((err) => console.error("❌ Model Loading Failed:", err));

app.post("/verify-food", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: "Missing imageUrl" });
  }

  try {
    const classifier = await classifierPromise;
    const labels = ["food", "not food"];
    const results = await classifier(imageUrl, labels);
    const isFood = results[0].label === "food" && results[0].score > 0.6;

    res.json({ isFood, confidence: results[0].score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/embed-image", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "Missing imageUrl" });

  try {
    const extractor = await extractorPromise;
    
    // Read the image from URL
    const image = await RawImage.read(imageUrl);
    
    // Generate the vector
    // 'mean' pooling isn't strictly necessary for CLIP vision (it uses the CLS token), 
    // but normalize=true is good practice for cosine similarity.
    const output = await extractor(image, { pooling: 'mean', normalize: true });
    
    const embedding = Array.from(output.data); 
    
    res.json({ embedding });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/moderate-text", async (req, res) => {
  const { text } = req.body;
  console.log("Received text for moderation:", text); // Debug log

  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const classifier = await textClassifierPromise;
    const labels = ["safe", "profanity", "obscene"];
    
    const output = await classifier(text, labels, { multi_label: false });
    const topLabel = output.labels[0];
    const isFlagged = topLabel !== "safe";

    console.log(`Moderation Result: ${topLabel} (${output.scores[0]})`); // Debug log

    res.json({ 
      isFlagged, 
      category: topLabel, 
      confidence: output.scores[0] 
    });
  } catch (error) {
    console.error("Moderation Logic Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AI microservice running on port ${PORT}`));