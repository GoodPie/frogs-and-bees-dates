# Recipe Import Feature

This document explains how to import recipes from external websites into the Frog'n'Bee recipe management system.

## Overview

The recipe import feature allows you to extract recipe data from websites that use [Schema.org Recipe](https://schema.org/Recipe) structured data (JSON-LD format). Most modern recipe websites include this data for SEO purposes, making it easy to import recipes.

## How to Import a Recipe

### Step 1: Find a Recipe Online

Navigate to any recipe website (e.g., AllRecipes, Food Network, BBC Good Food, etc.). Most modern recipe blogs and websites include structured data.

### Step 2: Open the Import Dialog

1. Go to the Recipes page in the app
2. Click the **"Import Recipe"** button (blue outline button next to "Add Recipe")

### Step 3: Extract Recipe Data

The import dialog will show instructions for extracting the recipe's JSON-LD data:

1. Keep the recipe webpage open in another tab/window
2. Open Browser DevTools (press F12 or right-click → Inspect)
3. Go to the Console tab
4. Paste one of these codes and press Enter:

**For most sites (single JSON-LD script):**
```javascript
copy(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent))
```

**For sites with multiple JSON-LD scripts (like RecipeTinEats, AllRecipes):**
```javascript
copy(Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  .map(s => JSON.parse(s.textContent))
  .find(obj => obj['@type'] === 'Recipe' || obj['@graph']?.find(g => g['@type'] === 'Recipe')))
```

5. The JSON will be automatically copied to your clipboard (Chrome/Edge)
   - For Firefox, use `console.log()` instead of `copy()` and manually copy the output
6. Paste it into the "Paste JSON-LD Data" textarea in the import dialog

**Note:** The parser accepts multiple formats (raw JSON, escaped console output, or backtick-wrapped strings)

### Step 4: Parse and Review

1. Click **"Parse Recipe Data"** to extract the recipe information
2. Review the parsed data:
   - ✅ **Success**: Green box showing recipe name, description, ingredient count, etc.
   - ❌ **Error**: Red box with specific errors (e.g., missing required fields)
   - ⚠️ **Warnings**: Orange alerts for missing optional data (won't prevent import)

### Step 5: Import and Edit

1. If parsing was successful, click **"Import Recipe"**
2. You'll be redirected to the Add Recipe form with all fields pre-filled
3. Review and edit any fields as needed:
   - Check ingredient quantities and formatting
   - Verify cooking times
   - Add or modify categories, cuisines, and keywords
   - Update the image URL if needed
4. Click **"Save Recipe"** to add it to your collection

## Supported Formats

The parser supports multiple Schema.org Recipe formats:

### Image Formats
- String: `"image": "https://example.com/image.jpg"`
- Array of strings: `"image": ["url1.jpg", "url2.jpg"]`
- Array of objects: `"image": [{"url": "image.jpg"}]`

### Instruction Formats
- String array: `["Step 1", "Step 2"]`
- HowToStep objects: `[{"text": "Step 1"}, {"name": "Mix", "text": "Mix ingredients"}]`

### Data Wrappers
- Direct Recipe object: `{"@type": "Recipe", ...}`
- @graph wrapper: `{"@graph": [{"@type": "Recipe", ...}]}`
- Array format: `[{"@type": "WebSite"}, {"@type": "Recipe", ...}]`

### Nutrition Information
Automatically extracts and parses nutrition data, removing units:
- Calories
- Carbohydrates, Protein, Fat
- Saturated Fat, Cholesterol, Sodium
- Fiber, Sugar

## Technical Details

### Files Added

1. **`src/utils/recipeParser.ts`** - Core parser logic
   - `parseRecipeJsonLd()` - Main parsing function
   - `getJsonLdExtractionInstructions()` - Helper for user instructions
   - Comprehensive type definitions for Schema.org Recipe format

2. **`src/hooks/useRecipeImport.ts`** - State management hook
   - Manages URL and JSON-LD input state
   - Handles parsing with loading states
   - Provides parsed recipe data

3. **`src/components/RecipeImport.tsx`** - UI components
   - `RecipeImportModal` - Full import dialog
   - `RecipeImportButton` - Trigger button with built-in modal
   - Visual feedback for success/errors/warnings

4. **`src/utils/__tests__/recipeParser.test.ts`** - Comprehensive tests
   - 17 test cases covering various JSON-LD formats
   - Edge case handling
   - Error and warning scenarios

### Modified Files

1. **`src/screens/RecipeList.tsx`**
   - Added import button to header

2. **`src/screens/AddRecipe.tsx`**
   - Added support for imported recipe data via location state
   - Visual indicator when recipe is imported

## Validation Rules

### Required Fields
- **Name**: Recipe must have a name
- **Image**: At least one image URL required

### Optional but Recommended
- Ingredients (warning if missing)
- Instructions (warning if missing)
- Prep time, cook time
- Categories, cuisines, keywords
- Nutrition information

## Future Enhancements (Phase 2)

When Firebase billing is enabled, consider implementing:

1. **Automated Import via Cloud Function**
   - User provides URL only (no manual JSON extraction)
   - Cloud Function fetches and parses the page
   - Returns structured recipe data

2. **Ingredient Parsing**
   - Parse ingredients into structured format (quantity, unit, item)
   - Use libraries like `recipe-ingredient-parser-v3`

3. **Bulk Import**
   - Import multiple recipes at once
   - Import from recipe collections/cookbooks

4. **Browser Extension**
   - One-click import from any recipe website
   - Similar to Paprika, Recipe Tamer, etc.

## Troubleshooting

### "Invalid JSON format" Error

This error occurs when the pasted data cannot be parsed as valid JSON. Common causes:

1. **Copied escaped JSON from console output**
   - If you see `\n`, `\"`, or other backslash sequences in your paste, you copied the string representation
   - **Solution:** Use the `copy()` command (see Step 3 above) instead of manually copying console output
   - The parser will automatically try to unescape this format, but raw JSON works best

2. **Incomplete copy/paste**
   - Missing opening `{` or closing `}`
   - **Solution:** Ensure you copied the entire output, from first `{` to last `}`

3. **Browser console formatting**
   - Some browsers add extra characters or formatting
   - **Solution:** Use the `copy()` command or try a different extraction method

4. **Wrapped in quotes or backticks**
   - Output shows backticks `` ` `` or quotes around the JSON
   - **Solution:** The parser automatically removes these, but ensure they're balanced (opening and closing)

**Still having issues?** Try this manual extraction:
```javascript
// Get the JSON-LD script content directly:
document.querySelector('script[type="application/ld+json"]').textContent
```
Then copy the entire output and paste it.

### "No Recipe schema found in JSON-LD"
- The website may not use structured data
- Try using the multiple scripts version (see Step 3 - RecipeTinEats version)
- Some sites have the Recipe inside a `@graph` array
- Try a different recipe website
- Check if the site uses Microdata or RDFa instead (not currently supported)

### Missing Images or Ingredients
- Some websites don't include complete data in their structured markup
- You can manually add missing information in the form after importing

### Sites with Multiple JSON-LD Scripts

Sites like RecipeTinEats, AllRecipes, and NYT Cooking often have multiple `<script type="application/ld+json">` tags. The first one might be for breadcrumbs or the website itself, not the recipe.

**Solution:** Always use the `querySelectorAll` version for these sites:
```javascript
copy(Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  .map(s => JSON.parse(s.textContent))
  .find(obj => obj['@type'] === 'Recipe' || obj['@graph']?.find(g => g['@type'] === 'Recipe')))
```

## Example Websites That Work Well

Most modern recipe websites support JSON-LD:
- AllRecipes.com
- Food Network
- Serious Eats
- BBC Good Food
- Bon Appétit
- NYT Cooking
- Most WordPress food blogs (with Yoast SEO or similar plugins)

## Testing

Run the recipe parser tests:
```bash
npm test -- src/utils/__tests__/recipeParser.test.ts
```

All 17 tests should pass, covering:
- Valid recipe parsing
- Multiple image formats
- Instruction forma/ts (string array, HowToStep)
- Author formats (string, object)
- @graph and array wrappers
- Error cases (invalid JSON, missing Recipe type)
- Required field validation
- Warning generation for missing optional fields
