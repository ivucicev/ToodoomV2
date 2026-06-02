import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DEFAULT_CATEGORIES, Household } from "./src/types"; // Importing type definitions

let tsGenAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!tsGenAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI sorting.");
    }
    tsGenAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return tsGenAI;
}

const systemInstruction = 
  "You are an AI sequence optimizer for household todo and shopping lists.\n" +
  "Your absolute goal is to reorder a batch of simple tasks or shopping list items into logical clusters or aisles.\n" +
  "For shopping and grocery lists (e.g. food items, milk, fruit, eggs, bread, shampoo):\n" +
  "Sort items strictly in the physical layout sequence of a standard supermarket:\n" +
  "1. Fruit & Produce (e.g., apples, bananas, salad, lemon, berries)\n" +
  "2. Bakery (e.g., bread, rolls, bagels, croissants, cookies)\n" +
  "3. Meat & Deli/Seafood (e.g., salami, turkey chest, bacon, beef, sausage, fish)\n" +
  "4. Dairy, Eggs & Cheese (e.g., eggs, milk, cheese, butter, yogurt, cream)\n" +
  "5. Pantry & Dry Goods (e.g., flour, sugar, baking soda, pasta, rice, olive oil)\n" +
  "6. Canned & Jarred Foods (e.g. tomato sauce, canned beans, soup)\n" +
  "7. Frozen Foods (e.g., frozen fruits, pizzas, frozen veggies)\n" +
  "8. Snacks & Beverages (e.g., potato chips, chocolates, soda, beer, coffee, tea)\n" +
  "9. Household, Soap & Personal Care (e.g., toilet paper, hand wash, shampoo, cleaner, garbage bag)\n" +
  "10. Pets & Botanical (e.g., dog biscuits, cat food, plant flowers).\n\n" +
  "For chore lists (e.g. clean living room, wash toilet, cut grass, water patio, wash plates):\n" +
  "Categorize and order tasks logically by room or area from inside to outside " +
  "(e.g., Kitchen -> Living Room -> Bathroom -> Bedrooms -> Attic/Basement -> Garden/Outdoors) to minimize tracing back and forth.\n\n" +
  "For any other miscellaneous or general list, group by logical common category and priority.\n" +
  "Always output a 'groupName' that represents the location/department, such as 'Fruit & Produce', 'Breakfast & Bakery', 'Meat & Deli', " +
  "'Dairy, Eggs & Cheese', 'Pantry & Dry Goods', 'Snacks & Soda', 'Household Care', 'Kitchen', 'Living Room', 'Garden', 'Yard', or another relevant category name, " +
  "and group identical or highly related items adjacent to each other. Keep the output clean, helpful, and natural. Do not make up items that are not in the query.";

// List of lovely human-friendly words to generate beautiful, memorable household IDs
const ADJECTIVES = [
  "cozy", "breezy", "bright", "sunny", "happy", "sweet", "warm", "peaceful", "calm", "golden", 
  "green", "velvet", "cloud", "gentle", "misty", "amber", "rustic", "comfy", "simple", "merry"
];

const NOUNS = [
  "kitchen", "cottage", "nook", "nest", "garden", "cabin", "loft", "hearth", "porch", "haven", 
  "den", "parlor", "flat", "house", "room", "terrace", "meadow", "villa", "studio", "corner"
];

// Helper to generate a random cozy friendly household ID
function generateCozyId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const code = Math.floor(10 + Math.random() * 90); // 2-digit number (10-99)
  return `${adj}-${noun}-${code}`;
}

// Convert a cozy ID to a readable title (e.g. cozy-kitchen-88 -> Cozy Kitchen)
function formatReadableName(id: string): string {
  const parts = id.split("-");
  if (parts.length >= 2) {
    const adj = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const noun = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return `${adj} ${noun}`;
  }
  return "Our Shared Home";
}

const DATA_DIR = path.join(process.cwd(), "data");

// Helper to verify password request header if household has password protection
async function verifyHouseholdPassword(id: string, reqHeaderPassword?: string): Promise<{ authorized: boolean; exists: boolean; household?: Household }> {
  const sanitizedId = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const filePath = path.join(DATA_DIR, `${sanitizedId}.json`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const household = JSON.parse(content) as Household;
    if (household.password && household.password.trim() !== "") {
      const isAuthorized = household.password === reqHeaderPassword;
      return { authorized: isAuthorized, exists: true, household };
    }
    return { authorized: true, exists: true, household };
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return { authorized: true, exists: false };
    }
    throw err;
  }
}

// Core database operations using local file system persistence
async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  await ensureDataDirectory();

  // API Route: Gen new beautiful household ID
  app.post("/api/new-household", async (req, res) => {
    try {
      const id = generateCozyId();
      const readableName = formatReadableName(id);
      
      const newHouse: Household = {
        id,
        name: readableName,
        members: ["Everyone"],
        categories: DEFAULT_CATEGORIES,
        todos: [],
        notes: [],
        notepadTabs: [
          { id: "tab-1", title: "general notes", content: "" }
        ],
        updatedAt: new Date().toISOString()
      };

      const filePath = path.join(DATA_DIR, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(newHouse, null, 2), "utf-8");
      
      res.json(newHouse);
    } catch (error) {
      console.error("Error creating new household:", error);
      res.status(500).json({ error: "Failed to create household" });
    }
  });

  // API Route: Get household configuration and todos
  app.get("/api/household/:id", async (req, res) => {
    const { id } = req.params;
    const sanitizedId = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    
    if (!sanitizedId) {
      return res.status(400).json({ error: "Invalid household code" });
    }

    const clientPass = req.headers["x-household-password"] as string | undefined;

    try {
      const { authorized, exists, household } = await verifyHouseholdPassword(sanitizedId, clientPass);
      if (exists) {
        if (!authorized) {
          return res.status(401).json({ error: "Password required or incorrect", code: "PASSWORD_REQUIRED" });
        }
        return res.json(household);
      }

      // If the household does not exist on disk, we auto-create it with this ID!
      // This is extremely convenient and prevents frustrating 404s when sharing custom keys.
      const readableName = formatReadableName(sanitizedId);
      
      const newHouse: Household = {
        id: sanitizedId,
        name: readableName,
        members: ["Everyone"],
        categories: DEFAULT_CATEGORIES,
        todos: [],
        notes: [],
        notepadTabs: [
          { id: "tab-1", title: "general notes", content: "" }
        ],
        updatedAt: new Date().toISOString()
      };

      const filePath = path.join(DATA_DIR, `${sanitizedId}.json`);
      await fs.writeFile(filePath, JSON.stringify(newHouse, null, 2), "utf-8");
      return res.json(newHouse);
    } catch (err: any) {
      console.error("Error reading household file:", err);
      return res.status(500).json({ error: "Failed to load household" });
    }
  });

  // API Route: Update household todos/categories/members (Single lock-step synchronization payload)
  app.post("/api/household/:id", async (req, res) => {
    const { id } = req.params;
    const sanitizedId = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    
    if (!sanitizedId) {
      return res.status(400).json({ error: "Invalid household code" });
    }

    const clientPass = req.headers["x-household-password"] as string | undefined;
    const updatedData = req.body as Household;

    try {
      const { authorized, exists, household } = await verifyHouseholdPassword(sanitizedId, clientPass);
      if (exists && !authorized) {
        return res.status(401).json({ error: "Password required or incorrect", code: "PASSWORD_REQUIRED" });
      }

      const filePath = path.join(DATA_DIR, `${sanitizedId}.json`);
      const updatedHouse: Household = {
        id: sanitizedId,
        name: updatedData.name || (household ? household.name : formatReadableName(sanitizedId)),
        members: updatedData.members || ["Everyone"],
        categories: updatedData.categories || DEFAULT_CATEGORIES,
        todos: updatedData.todos || [],
        notes: updatedData.notes || [],
        notepadTabs: updatedData.notepadTabs || [
          { id: "tab-1", title: "general notes", content: "" }
        ],
        updatedAt: new Date().toISOString(),
        password: updatedData.password !== undefined ? updatedData.password : (household?.password || undefined)
      };

      await fs.writeFile(filePath, JSON.stringify(updatedHouse, null, 2), "utf-8");
      return res.json(updatedHouse);
    } catch (err) {
      console.error("Error saving household file:", err);
      return res.status(500).json({ error: "Failed to sync updates" });
    }
  });

  // API Route: AI intelligence intelligent order & category sorting
  app.post("/api/ai-sort", async (req, res) => {
    try {
      const { items, categoryName } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Missing items to organize" });
      }

      if (items.length === 0) {
        return res.json({ sortedItems: [] });
      }

      // Quick clean up mapping to send the absolute lightest payload possible to Gemini
      const itemsToPromt = items.map(it => ({ id: it.id, text: it.text }));

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Category template/type: "${categoryName || "Everything Else"}"\nItems to organize:\n${JSON.stringify(itemsToPromt)}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sortedItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    groupName: { type: Type.STRING, description: "Compact human-friendly label for supermarket department or room location" }
                  },
                  required: ["id", "text", "groupName"]
                }
              }
            },
            required: ["sortedItems"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());
      return res.json(parsed);
    } catch (err: any) {
      console.error("AI Sort Server Error:", err);
      
      // If the API key is missing or invalid, fail gracefully with clear guidelines to prevent crashing
      if (err.message && err.message.includes("GEMINI_API_KEY")) {
        return res.status(403).json({ 
          error: "API Key Required", 
          details: "Please configure your GEMINI_API_KEY in the Settings > Secrets menu." 
        });
      }
      return res.status(500).json({ error: "AI sorting is temporarily unavailable. Check server logs." });
    }
  });

  // Vite development vs Production asset serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Breezy Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
