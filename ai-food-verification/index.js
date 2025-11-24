import express from "express";
import { pipeline } from "@xenova/transformers";

const app = express();
app.use(express.json());

const classifierPromise = pipeline(
  "zero-shot-image-classification",
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AI microservice running on port ${PORT}`));
