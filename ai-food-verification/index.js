import express from "express";
import { pipeline, RawImage } from "@xenova/transformers";

const app = express();
app.use(express.json());

const classifierPromise = pipeline(
  "zero-shot-image-classification",
  "Xenova/clip-vit-base-patch32"
);

// Extractor MUST use "image-feature-extraction" to target the Vision Encoder
const extractorPromise = pipeline(
  "image-feature-extraction", 
  "Xenova/clip-vit-base-patch32"
);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AI microservice running on port ${PORT}`));