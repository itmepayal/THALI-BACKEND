const express = require("express");
const {
  getRecipes,
  getRecipe,
  addRecipe,
  editRecipe,
  deleteRecipe,
  uploadImage,
} = require("../controller/recipe");
const verifyToken = require("../middleware/auth");
const router = express.Router();

router.get("/", getRecipes); // all recipes
router.get("/:id", getRecipe); // one recipe

router.post("/", verifyToken, uploadImage, addRecipe); // add recipe
router.put("/:id", verifyToken, uploadImage, editRecipe); // edit own recipe
router.delete("/:id", verifyToken, deleteRecipe); // delete own recipe

module.exports = router;
