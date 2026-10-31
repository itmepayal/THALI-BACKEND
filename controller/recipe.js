const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const Recipes = require("../models/recipe");

const IMAGE_DIR = path.join(process.cwd(), "public", "images");
fs.mkdirSync(IMAGE_DIR, { recursive: true });

const EXT_BY_TYPE = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGE_DIR),
  filename: (req, file, cb) => {
    const ext =
      path.extname(file.originalname).toLowerCase() ||
      EXT_BY_TYPE[file.mimetype] ||
      ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

const uploadImage = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "The image must be smaller than 5 MB"
        : err.message;
    return res.status(400).json({ error: message });
  });
};

const removeImage = (filename) => {
  if (!filename) return;
  fs.unlink(path.join(IMAGE_DIR, path.basename(filename)), () => {});
};

const toIngredients = (value) => {
  let v = value;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) v = parsed;
    } catch {}
  }
  return []
    .concat(v ?? [])
    .map((s) => String(s).trim())
    .filter(Boolean);
};

const isOwner = (recipe, req) =>
  recipe.createdBy && recipe.createdBy.toString() === req.user.id;

const getRecipes = async (req, res) => {
  try {
    const recipes = await Recipes.find().sort({ createdAt: -1 });
    return res.json(recipes);
  } catch (err) {
    console.error("getRecipes error:", err);
    return res.status(500).json({ error: "Could not load recipes" });
  }
};

const getRecipe = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid recipe id" });
    }
    const recipe = await Recipes.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    return res.json(recipe);
  } catch (err) {
    console.error("getRecipe error:", err);
    return res.status(500).json({ error: "Could not load the recipe" });
  }
};

const addRecipe = async (req, res) => {
  try {
    const { title, instructions, time } = req.body;
    const ingredients = toIngredients(req.body.ingredients);

    if (!title?.trim() || !instructions?.trim() || ingredients.length === 0) {
      removeImage(req.file?.filename);
      return res
        .status(400)
        .json({ error: "Title, ingredients and instructions are required" });
    }

    const recipe = await Recipes.create({
      title: title.trim(),
      ingredients,
      instructions: instructions.trim(),
      time: time?.trim() || undefined,
      coverImage: req.file?.filename,
      createdBy: req.user.id,
    });
    return res.status(201).json(recipe);
  } catch (err) {
    removeImage(req.file?.filename);
    console.error("addRecipe error:", err);
    return res.status(500).json({ error: "Could not save the recipe" });
  }
};

const editRecipe = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      removeImage(req.file?.filename);
      return res.status(400).json({ error: "Invalid recipe id" });
    }

    const recipe = await Recipes.findById(req.params.id);
    if (!recipe) {
      removeImage(req.file?.filename);
      return res.status(404).json({ error: "Recipe not found" });
    }
    if (!isOwner(recipe, req)) {
      removeImage(req.file?.filename);
      return res
        .status(403)
        .json({ error: "You can only change your own recipes" });
    }

    const { title, instructions, time } = req.body;
    const ingredients = toIngredients(req.body.ingredients);

    const update = {};
    if (title?.trim()) update.title = title.trim();
    if (instructions?.trim()) update.instructions = instructions.trim();
    if (ingredients.length) update.ingredients = ingredients;
    if (time !== undefined) update.time = time.trim();
    if (req.file) update.coverImage = req.file.filename;

    const updated = await Recipes.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (req.file) removeImage(recipe.coverImage);
    return res.json(updated);
  } catch (err) {
    removeImage(req.file?.filename);
    console.error("editRecipe error:", err);
    return res.status(500).json({ error: "Could not update the recipe" });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid recipe id" });
    }

    const recipe = await Recipes.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    if (!isOwner(recipe, req)) {
      return res
        .status(403)
        .json({ error: "You can only delete your own recipes" });
    }

    await Recipes.deleteOne({ _id: recipe._id });
    removeImage(recipe.coverImage);
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("deleteRecipe error:", err);
    return res.status(500).json({ error: "Could not delete the recipe" });
  }
};

module.exports = {
  getRecipes,
  getRecipe,
  addRecipe,
  editRecipe,
  deleteRecipe,
  uploadImage,
  upload,
};
