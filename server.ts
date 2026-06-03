import express from "express";
import path from "path";
import Database from "better-sqlite3";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DEFAULT_CATEGORIES, DEFAULT_NOTE_CATEGORIES, Household } from "./src/types";

// ─── SQLite setup ────────────────────────────────────────────────────────────

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "households.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS households (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

function getHousehold(id: string): Household | null {
  const row = db.prepare("SELECT data FROM households WHERE id = ?").get(id) as { data: string } | undefined;
  if (!row) return null;
  const h = JSON.parse(row.data) as Household;
  // Migrate: strip legacy "Everyone"
  h.members = (h.members || []).filter((m: string) => m.toLowerCase() !== "everyone");
  return h;
}

function saveHousehold(h: Household): void {
  const now = h.updatedAt || new Date().toISOString();
  db.prepare(`
    INSERT INTO households (id, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(h.id, JSON.stringify(h), now);
}

function householdExists(id: string): boolean {
  const row = db.prepare("SELECT 1 FROM households WHERE id = ?").get(id);
  return !!row;
}

function idExists(id: string): boolean {
  return householdExists(id);
}

// ─── AI setup ────────────────────────────────────────────────────────────────

let tsGenAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!tsGenAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is required for AI sorting.");
    tsGenAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
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
  "Categorize and order tasks logically by room or area from inside to outside.\n\n" +
  "For any other miscellaneous or general list, group by logical common category and priority.\n" +
  "Always output a 'groupName' for each item.";

// ─── ID helpers ──────────────────────────────────────────────────────────────

const ADJECTIVES = ["cozy","breezy","bright","sunny","happy","sweet","warm","peaceful","calm","golden","green","velvet","cloud","gentle","misty","amber","rustic","comfy","simple","merry"];
const NOUNS      = ["kitchen","cottage","nook","nest","garden","cabin","loft","hearth","porch","haven","den","parlor","flat","house","room","terrace","meadow","villa","studio","corner"];

function generateCozyId(): string {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const code = Math.floor(10 + Math.random() * 90);
  return `${adj}-${noun}-${code}`;
}

function slugifyName(name: string): string {
  return name.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 28);
}

function generateNamedId(name: string): string {
  const slug = slugifyName(name) || "home";
  for (let i = 0; i < 10; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const id = `${slug}-${num}`;
    if (!idExists(id)) return id;
  }
  return generateCozyId();
}

function formatReadableName(id: string): string {
  const parts = id.split("-");
  if (parts.length >= 2) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + " " +
           parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  }
  return "Our Shared Home";
}

// ─── Server ──────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: "50mb" }));

  // Health check
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // POST /api/new-household
  app.post("/api/new-household", (req, res) => {
    try {
      const requestedName = (req.body?.name || "").trim();
      const ownerName     = (req.body?.ownerName || "").trim();
      const ownerPin      = (req.body?.ownerPin || "").trim();
      const id            = requestedName ? generateNamedId(requestedName) : generateCozyId();
      const readableName  = requestedName || formatReadableName(id);

      const memberPins: Record<string, string> = {};
      if (ownerName && ownerPin) memberPins[ownerName] = ownerPin;

      const newHouse: Household = {
        id,
        name: readableName,
        members: ownerName ? [ownerName] : [],
        categories: DEFAULT_CATEGORIES,
        noteCategories: DEFAULT_NOTE_CATEGORIES,
        todos: [],
        profileNotes: {},
        profileNotepads: {},
        owner: ownerName || "",
        memberPins,
        updatedAt: new Date().toISOString(),
      };

      saveHousehold(newHouse);
      res.json(newHouse);
    } catch (err) {
      console.error("Error creating household:", err);
      res.status(500).json({ error: "Failed to create household" });
    }
  });

  // GET /api/household/:id
  app.get("/api/household/:id", (req, res) => {
    const sanitizedId = req.params.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!sanitizedId) return res.status(400).json({ error: "Invalid household code" });

    const clientPass = req.headers["x-household-password"] as string | undefined;

    try {
      const household = getHousehold(sanitizedId);

      if (household) {
        if (household.password && household.password.trim() !== "") {
          if (household.password !== clientPass) {
            return res.status(401).json({ error: "Password required or incorrect", code: "PASSWORD_REQUIRED" });
          }
        }
        return res.json(household);
      }

      // Auto-create if not found (convenient for shared custom links)
      const newHouse: Household = {
        id: sanitizedId,
        name: formatReadableName(sanitizedId),
        members: [],
        categories: DEFAULT_CATEGORIES,
        noteCategories: DEFAULT_NOTE_CATEGORIES,
        todos: [],
        profileNotes: {},
        profileNotepads: {},
        owner: "",
        memberPins: {},
        updatedAt: new Date().toISOString(),
      };
      saveHousehold(newHouse);
      return res.json(newHouse);
    } catch (err) {
      console.error("Error reading household:", err);
      return res.status(500).json({ error: "Failed to load household" });
    }
  });

  // POST /api/household/:id  (save/update)
  app.post("/api/household/:id", (req, res) => {
    const sanitizedId = req.params.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!sanitizedId) return res.status(400).json({ error: "Invalid household code" });

    const clientPass  = req.headers["x-household-password"] as string | undefined;
    const updatedData = req.body as Household;

    try {
      const existing = getHousehold(sanitizedId);

      if (existing && existing.password && existing.password.trim() !== "") {
        if (existing.password !== clientPass) {
          return res.status(401).json({ error: "Password required or incorrect", code: "PASSWORD_REQUIRED" });
        }
      }

      const updatedHouse: Household = {
        id: sanitizedId,
        name: updatedData.name || (existing?.name ?? formatReadableName(sanitizedId)),
        members: (updatedData.members || []).filter((m: string) => m.toLowerCase() !== "everyone"),
        categories: updatedData.categories || DEFAULT_CATEGORIES,
        noteCategories: updatedData.noteCategories ?? existing?.noteCategories ?? DEFAULT_NOTE_CATEGORIES,
        todos: updatedData.todos || [],
        profileNotes: updatedData.profileNotes ?? existing?.profileNotes ?? {},
        profileNotepads: updatedData.profileNotepads ?? existing?.profileNotepads ?? {},
        owner: updatedData.owner !== undefined ? updatedData.owner : (existing?.owner ?? ""),
        memberPins: updatedData.memberPins !== undefined ? updatedData.memberPins : (existing?.memberPins ?? {}),
        updatedAt: new Date().toISOString(),
        password: updatedData.password !== undefined ? updatedData.password : existing?.password,
      };

      saveHousehold(updatedHouse);
      return res.json(updatedHouse);
    } catch (err) {
      console.error("Error saving household:", err);
      return res.status(500).json({ error: "Failed to sync updates" });
    }
  });

  // POST /api/ai-sort
  app.post("/api/ai-sort", async (req, res) => {
    try {
      const { items, categoryName } = req.body;
      if (!items || !Array.isArray(items)) return res.status(400).json({ error: "Missing items" });
      if (items.length === 0) return res.json({ sortedItems: [] });

      const itemsToPrompt = items.map((it: any) => ({ id: it.id, text: it.text }));
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Category: "${categoryName || "Everything Else"}"\nItems:\n${JSON.stringify(itemsToPrompt)}`,
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
                    id:        { type: Type.STRING },
                    text:      { type: Type.STRING },
                    groupName: { type: Type.STRING },
                  },
                  required: ["id", "text", "groupName"],
                },
              },
            },
            required: ["sortedItems"],
          },
        },
      });

      return res.json(JSON.parse((response.text || "{}").trim()));
    } catch (err: any) {
      console.error("AI Sort error:", err);
      if (err.message?.includes("GEMINI_API_KEY")) {
        return res.status(403).json({ error: "API Key Required" });
      }
      return res.status(500).json({ error: "AI sorting unavailable" });
    }
  });

  // Vite dev / production static
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Breezy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
