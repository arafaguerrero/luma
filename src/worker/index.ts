import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  GeneratePaletteRequestSchema,
  FindEquivalencyRequestSchema,
} from "@/shared/types";

// Extend Env type to include our bindings
interface ExtendedEnv extends Env {
  R2_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: ExtendedEnv }>();

app.use("/*", cors());

// Auth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if user has active subscription
  const subscription = await c.env.DB.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))"
  )
    .bind(user.id)
    .first();

  return c.json({
    ...user,
    hasActiveSubscription: !!subscription,
    subscription: subscription || null,
  });
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Create or update subscription
app.post("/api/subscriptions", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { plan } = body;

  if (!plan || !['monthly', 'semester', 'annual'].includes(plan)) {
    return c.json({ error: "Invalid plan" }, 400);
  }

  // Calculate expiration based on plan
  const expiresAt = new Date();
  if (plan === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else if (plan === 'semester') {
    expiresAt.setMonth(expiresAt.getMonth() + 6);
  } else if (plan === 'annual') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  // Check if subscription exists
  const existing = await c.env.DB.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ?"
  )
    .bind(user.id)
    .first();

  if (existing) {
    // Update existing subscription
    await c.env.DB.prepare(
      "UPDATE subscriptions SET plan = ?, status = 'active', expires_at = ?, updated_at = datetime('now') WHERE user_id = ?"
    )
      .bind(plan, expiresAt.toISOString(), user.id)
      .run();
  } else {
    // Create new subscription
    await c.env.DB.prepare(
      "INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at) VALUES (?, ?, 'active', datetime('now'), ?)"
    )
      .bind(user.id, plan, expiresAt.toISOString())
      .run();
  }

  return c.json({ success: true, plan, expiresAt });
});

// Track and check preview usage
app.post("/api/preview/track", async (c) => {
  const body = await c.req.json();
  const { fingerprint } = body;

  if (!fingerprint) {
    return c.json({ error: "Fingerprint is required" }, 400);
  }

  // Get current user if authenticated
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  let userId = null;

  if (sessionToken) {
    try {
      const { getCurrentUser } = await import("@getmocha/users-service/backend");
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      if (user) userId = user.id;
    } catch (error) {
      // Not authenticated, continue without user
    }
  }

  // Check if user has active subscription
  let hasActiveSubscription = false;
  if (userId) {
    const subscription = await c.env.DB.prepare(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))"
    )
      .bind(userId)
      .first();
    hasActiveSubscription = !!subscription;
  }

  // If user has subscription, allow unlimited previews
  if (hasActiveSubscription) {
    return c.json({ 
      allowed: true, 
      previewCount: 0,
      limit: -1,
      hasActiveSubscription: true 
    });
  }

  // Check existing preview usage
  let usage = await c.env.DB.prepare(
    "SELECT * FROM preview_usage WHERE fingerprint = ?"
  )
    .bind(fingerprint)
    .first();

  const PREVIEW_LIMIT = 3;

  if (!usage) {
    // Create new usage record
    await c.env.DB.prepare(
      "INSERT INTO preview_usage (fingerprint, user_id, preview_count, last_preview_at) VALUES (?, ?, 1, datetime('now'))"
    )
      .bind(fingerprint, userId)
      .run();

    return c.json({ 
      allowed: true, 
      previewCount: 1, 
      limit: PREVIEW_LIMIT,
      hasActiveSubscription: false 
    });
  }

  // Associate user_id if not set
  if (!usage.user_id && userId) {
    await c.env.DB.prepare(
      "UPDATE preview_usage SET user_id = ? WHERE fingerprint = ?"
    )
      .bind(userId, fingerprint)
      .run();
  }

  const currentCount = (usage.preview_count as number) || 0;

  if (currentCount >= PREVIEW_LIMIT) {
    return c.json({ 
      allowed: false, 
      previewCount: currentCount, 
      limit: PREVIEW_LIMIT,
      hasActiveSubscription: false 
    });
  }

  // Increment preview count
  await c.env.DB.prepare(
    "UPDATE preview_usage SET preview_count = preview_count + 1, last_preview_at = datetime('now') WHERE fingerprint = ?"
  )
    .bind(fingerprint)
    .run();

  return c.json({ 
    allowed: true, 
    previewCount: currentCount + 1, 
    limit: PREVIEW_LIMIT,
    hasActiveSubscription: false 
  });
});

// Get current preview status
app.post("/api/preview/status", async (c) => {
  const body = await c.req.json();
  const { fingerprint } = body;

  if (!fingerprint) {
    return c.json({ error: "Fingerprint is required" }, 400);
  }

  // Get current user if authenticated
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  let userId = null;

  if (sessionToken) {
    try {
      const { getCurrentUser } = await import("@getmocha/users-service/backend");
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      if (user) userId = user.id;
    } catch (error) {
      // Not authenticated
    }
  }

  // Check if user has active subscription
  let hasActiveSubscription = false;
  if (userId) {
    const subscription = await c.env.DB.prepare(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))"
    )
      .bind(userId)
      .first();
    hasActiveSubscription = !!subscription;
  }

  if (hasActiveSubscription) {
    return c.json({ 
      previewCount: 0, 
      limit: -1, 
      hasActiveSubscription: true,
      isAuthenticated: !!userId 
    });
  }

  const usage = await c.env.DB.prepare(
    "SELECT * FROM preview_usage WHERE fingerprint = ?"
  )
    .bind(fingerprint)
    .first();

  const PREVIEW_LIMIT = 3;
  const previewCount = usage ? (usage.preview_count as number) || 0 : 0;

  return c.json({ 
    previewCount, 
    limit: PREVIEW_LIMIT, 
    hasActiveSubscription: false,
    isAuthenticated: !!userId 
  });
});

// Generate palette with preset colors (no AI needed)
app.post("/api/palettes/generate", async (c) => {
  try {
    const body = await c.req.json();
    const { colorCount, style, markerSet } = body;

    if (!markerSet) {
      return c.json({ error: "Marker set is required" }, 400);
    }

    // Predefined color palettes based on style
    const stylePalettes: Record<string, string[]> = {
      pastel: ["#FFD1DC", "#E0BBE4", "#FFDFD3", "#C3E6E8", "#B4E7CE", "#F8B4D9", "#D4F1F4", "#FFF0E1", "#E6E6FA", "#F0E68C", "#FFE4E1", "#F5DEB3"],
      warm: ["#FF6B6B", "#FFA07A", "#FFD93D", "#F4A460", "#FF8C42", "#FF4500", "#FF7F50", "#DC143C", "#FF6347", "#FA8072", "#E9967A", "#F08080"],
      cold: ["#4A90E2", "#87CEEB", "#B0E0E6", "#5F9EA0", "#4682B4", "#6495ED", "#00CED1", "#20B2AA", "#48D1CC", "#40E0D0", "#00BFFF", "#1E90FF"],
      summer: ["#FFE66D", "#4ECDC4", "#FF6B6B", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8E6CF", "#FDFD96", "#FF9AA2"],
      autumn: ["#D4A574", "#C9A882", "#B88A5E", "#CD853F", "#DEB887", "#D2691E", "#BC8F8F", "#A0522D", "#8B4513", "#F4A460"],
      nature: ["#006994", "#4ECDC4", "#1A535C", "#93E1D8", "#0B3954", "#2E8B57", "#3CB371", "#228B22", "#32CD32", "#90EE90"],
      neutral: ["#D4A574", "#8B7355", "#A0826D", "#C9A882", "#B88A5E", "#BDB76B", "#A0826D", "#C0C0C0", "#D3D3D3", "#DCDCDC"],
      vibrant: ["#FF1744", "#F50057", "#D500F9", "#651FFF", "#2979FF", "#00E5FF", "#1DE9B6", "#00E676", "#76FF03", "#FFEA00"],
    };

    const targetColors = (stylePalettes[style] || stylePalettes.pastel).slice(0, colorCount);

    // Map marker set to brand and set_name
    const setMapping: Record<string, { brand: string; set_name: string }> = {
      honolulu: { brand: "ohuhu", set_name: "320 colors" },
      honolulu_plus: { brand: "ohuhu", set_name: "320 colors" },
      skin_tones: { brand: "ohuhu", set_name: "320 colors" },
      pastel_set: { brand: "ohuhu", set_name: "320 colors" },
      brush_set: { brand: "ohuhu", set_name: "320 colors" },
    };

    const mapping = setMapping[markerSet] || { brand: "ohuhu", set_name: "320 colors" };

    // Get all colors from the selected set
    const availableColors = await c.env.DB.prepare(
      "SELECT * FROM color_equivalencies WHERE brand = ? AND set_name = ?"
    )
      .bind(mapping.brand, mapping.set_name)
      .all();

    if (availableColors.results.length === 0) {
      return c.json({ error: "No colors found for this set" }, 404);
    }

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    // Calculate color distance
    const colorDistance = (hex1: string, hex2: string) => {
      const rgb1 = hexToRgb(hex1);
      const rgb2 = hexToRgb(hex2);
      if (!rgb1 || !rgb2) return Infinity;

      return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
      );
    };

    // Find best matches for each target color
    const matches: any[] = [];
    const usedColors = new Set();

    for (const targetColor of targetColors) {
      let bestMatch = null;
      let bestDistance = Infinity;

      for (const availableColor of availableColors.results) {
        if (usedColors.has(availableColor.id)) continue;

        const distance = colorDistance(targetColor, availableColor.hex as string);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = availableColor;
        }
      }

      if (bestMatch) {
        usedColors.add(bestMatch.id);
        matches.push(bestMatch);
      }
    }

    // Save to database
    const result = await c.env.DB.prepare(
      "INSERT INTO palettes (name, colors, style, source, user_id) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        `${style.charAt(0).toUpperCase() + style.slice(1)} Palette`,
        JSON.stringify(matches.map((m) => m.hex)),
        style,
        "preset",
        null
      )
      .run();

    return c.json({
      id: result.meta.last_row_id,
      colors: matches,
      style,
    });
  } catch (error) {
    console.error("Error generating palette:", error);
    return c.json({ error: "Failed to generate palette" }, 500);
  }
});

// Match extracted colors with brand colors
app.post("/api/palettes/match-colors", async (c) => {
  try {
    const body = await c.req.json();
    const { colors, brand, set } = body;

    if (!colors || !Array.isArray(colors)) {
      return c.json({ error: "Colors array is required" }, 400);
    }

    if (!brand || !set) {
      return c.json({ error: "Brand and set are required" }, 400);
    }

    // Get all colors from the selected brand and set
    const availableColors = await c.env.DB.prepare(
      "SELECT * FROM color_equivalencies WHERE brand = ? AND set_name = ?"
    )
      .bind(brand, set)
      .all();

    if (availableColors.results.length === 0) {
      // Fallback: get colors from brand without set filter
      const fallbackColors = await c.env.DB.prepare(
        "SELECT * FROM color_equivalencies WHERE brand = ?"
      )
        .bind(brand)
        .all();
      
      if (fallbackColors.results.length === 0) {
        return c.json({ 
          error: "No colors found for this brand/set combination." 
        }, 404);
      }
      
      availableColors.results = fallbackColors.results;
    }

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    // Calculate color distance using Delta E (simplified)
    const colorDistance = (hex1: string, hex2: string) => {
      const rgb1 = hexToRgb(hex1);
      const rgb2 = hexToRgb(hex2);
      if (!rgb1 || !rgb2) return Infinity;

      return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
      );
    };

    // Find best matches for each extracted color
    const matches: any[] = [];
    const usedColors = new Set();

    for (const extractedColor of colors) {
      let bestMatch = null;
      let bestDistance = Infinity;

      for (const availableColor of availableColors.results) {
        if (usedColors.has(availableColor.id)) continue;

        const distance = colorDistance(extractedColor, availableColor.hex as string);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = availableColor;
        }
      }

      if (bestMatch) {
        usedColors.add(bestMatch.id);
        matches.push(bestMatch);
      }
    }

    // Save to database
    await c.env.DB.prepare(
      "INSERT INTO palettes (name, colors, source, user_id) VALUES (?, ?, ?, ?)"
    )
      .bind(
        `${brand} ${set} Palette`,
        JSON.stringify(matches.map(m => m.hex)),
        "image_analysis",
        null
      )
      .run();

    return c.json({
      colors: matches,
    });
  } catch (error) {
    console.error("Error matching colors:", error);
    return c.json({ error: "Failed to match colors" }, 500);
  }
});

// Get file from R2
app.get("/api/files/:filename{.+}", async (c) => {
  try {
    const filename = c.req.param("filename");
    const object = await c.env.R2_BUCKET.get(filename);

    if (!object) {
      return c.json({ error: "File not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return c.body(object.body, { headers });
  } catch (error) {
    console.error("Error fetching file:", error);
    return c.json({ error: "Failed to fetch file" }, 500);
  }
});

// Find color equivalency
app.post("/api/colors/equivalency", async (c) => {
  try {
    const body = await c.req.json();
    const { code, brand } = FindEquivalencyRequestSchema.parse(body);

    // Find the source color
    const sourceColor = await c.env.DB.prepare(
      "SELECT * FROM color_equivalencies WHERE brand = ? AND code = ?"
    )
      .bind(brand, code)
      .first();

    if (!sourceColor) {
      return c.json({ error: "Color code not found" }, 404);
    }

    // Find similar colors from other brands
    const allColors = await c.env.DB.prepare(
      "SELECT * FROM color_equivalencies WHERE brand != ?"
    )
      .bind(brand)
      .all();

    // Simple hex distance calculation for equivalency
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const colorDistance = (hex1: string, hex2: string) => {
      const rgb1 = hexToRgb(hex1);
      const rgb2 = hexToRgb(hex2);
      if (!rgb1 || !rgb2) return Infinity;

      return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
      );
    };

    const sourceHex = sourceColor.hex as string;
    const matches = allColors.results
      .map((color: any) => ({
        ...color,
        distance: colorDistance(sourceHex, color.hex),
      }))
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 5);

    return c.json({
      source: sourceColor,
      matches,
    });
  } catch (error) {
    console.error("Error finding equivalency:", error);
    return c.json({ error: "Failed to find equivalency" }, 500);
  }
});

// Get recent palettes
app.get("/api/palettes/recent", async (c) => {
  try {
    const palettes = await c.env.DB.prepare(
      "SELECT * FROM palettes ORDER BY created_at DESC LIMIT 10"
    ).all();

    return c.json(palettes.results);
  } catch (error) {
    console.error("Error fetching palettes:", error);
    return c.json({ error: "Failed to fetch palettes" }, 500);
  }
});

// Get preset palettes
app.get("/api/palettes/presets", async (c) => {
  const presets = [
    {
      name: "Pastel",
      colors: ["#FFD1DC", "#E0BBE4", "#FFDFD3", "#C3E6E8", "#B4E7CE"],
      style: "pastel",
    },
    {
      name: "Warm",
      colors: ["#FF6B6B", "#FFA07A", "#FFD93D", "#F4A460", "#FF8C42"],
      style: "warm",
    },
    {
      name: "Cold",
      colors: ["#4A90E2", "#87CEEB", "#B0E0E6", "#5F9EA0", "#4682B4"],
      style: "cold",
    },
    {
      name: "Ocean",
      colors: ["#006994", "#4ECDC4", "#1A535C", "#93E1D8", "#0B3954"],
      style: "nature",
    },
    {
      name: "Vintage",
      colors: ["#D4A574", "#8B7355", "#A0826D", "#C9A882", "#B88A5E"],
      style: "neutral",
    },
    {
      name: "Skin Tones",
      colors: ["#FDDBC7", "#F4A582", "#D6604D", "#B2182B", "#8B4513"],
      style: "neutral",
    },
  ];

  return c.json(presets);
});

// Get colors by brand and set
app.get("/api/colors", async (c) => {
  try {
    const brand = c.req.query("brand");
    const set = c.req.query("set");

    if (!brand || !set) {
      return c.json({ error: "Brand and set are required" }, 400);
    }

    const colors = await c.env.DB.prepare(
      "SELECT * FROM color_equivalencies WHERE brand = ? AND set_name = ? ORDER BY code"
    )
      .bind(brand, set)
      .all();

    return c.json(colors.results);
  } catch (error) {
    console.error("Error fetching colors:", error);
    return c.json({ error: "Failed to fetch colors" }, 500);
  }
});

// Generate color harmony
app.post("/api/colors/harmony", async (c) => {
  try {
    const body = await c.req.json();
    const { colorCode, brand, set, harmonyType } = body;

    if (!colorCode || !brand || !set || !harmonyType) {
      return c.json({ error: "Missing required parameters" }, 400);
    }

    // Find the base color
    const baseColor = await c.env.DB.prepare(
      "SELECT * FROM color_equivalencies WHERE code = ? AND brand = ? AND set_name = ?"
    )
      .bind(colorCode, brand, set)
      .first();

    if (!baseColor) {
      return c.json({ error: "Base color not found" }, 404);
    }

    // Get all colors from the same set
    const allColors = await c.env.DB.prepare(
      "SELECT * FROM color_equivalencies WHERE brand = ? AND set_name = ? ORDER BY code"
    )
      .bind(brand, set)
      .all();

    const colors = allColors.results as any[];

    // Parse color code to extract family, saturation, and brightness
    const parseColorCode = (code: string) => {
      const match = code.match(/^([A-Z]+)(\d+)$/);
      if (!match) return null;
      
      const family = match[1];
      const number = match[2];
      const saturation = parseInt(number[0]) || 0;
      const brightness = parseInt(number.substring(1)) || 0;
      
      return { family, saturation, brightness, number: parseInt(number) };
    };

    const baseParsed = parseColorCode(baseColor.code as string);
    if (!baseParsed) {
      return c.json({ error: "Invalid color code format" }, 400);
    }

    // Define color families in wheel order
    const familyWheel = ['R', 'RO', 'O', 'YO', 'Y', 'YG', 'G', 'BG', 'B', 'BV', 'V', 'RV'];
    const baseFamilyIndex = familyWheel.indexOf(baseParsed.family);

    // Helper to get colors at specific positions on the wheel
    const getColorsByPosition = (positions: number[]) => {
      const harmonyColors: any[] = [];
      
      for (const offset of positions) {
        const targetIndex = (baseFamilyIndex + offset + familyWheel.length) % familyWheel.length;
        const targetFamily = familyWheel[targetIndex];
        
        // Find colors in the target family with similar saturation/brightness
        const familyColors = colors.filter((c: any) => {
          const parsed = parseColorCode(c.code);
          if (!parsed) return false;
          
          return parsed.family === targetFamily && 
                 Math.abs(parsed.saturation - baseParsed.saturation) <= 2 &&
                 Math.abs(parsed.brightness - baseParsed.brightness) <= 3;
        });
        
        if (familyColors.length > 0) {
          // Pick the closest match
          harmonyColors.push(familyColors[0]);
        }
      }
      
      return harmonyColors;
    };

    let harmonyColors: any[] = [];
    let actualHarmonyType = harmonyType;
    let fallbackUsed = false;

    // Helper to try generating a harmony
    const tryHarmony = (type: string) => {
      switch (type) {
        case 'complementary':
          return getColorsByPosition([6]);
        case 'analogous':
          return getColorsByPosition([-2, -1, 1, 2]);
        case 'triadic':
          return getColorsByPosition([4, 8]);
        case 'tetradic':
          return getColorsByPosition([3, 6, 9]);
        case 'split_complementary':
          return getColorsByPosition([5, 7]);
        case 'monochromatic':
          const monoColors = colors.filter((c: any) => {
            const parsed = parseColorCode(c.code);
            return parsed && 
                   parsed.family === baseParsed.family && 
                   c.code !== baseColor.code;
          });
          return monoColors.slice(0, 6);
        case 'square':
          return getColorsByPosition([3, 6, 9]);
        case 'diadic':
          return getColorsByPosition([2]);
        default:
          return [];
      }
    };

    // Try the requested harmony
    harmonyColors = tryHarmony(harmonyType);

    // If harmony failed (no colors found), try fallbacks
    if (harmonyColors.length === 0) {
      fallbackUsed = true;
      const fallbackOrder = ['analogous', 'complementary', 'monochromatic', 'triadic'];
      
      for (const fallbackType of fallbackOrder) {
        if (fallbackType !== harmonyType) {
          harmonyColors = tryHarmony(fallbackType);
          if (harmonyColors.length > 0) {
            actualHarmonyType = fallbackType;
            break;
          }
        }
      }
    }

    // Always include the base color first
    const result = [baseColor, ...harmonyColors];

    return c.json({ 
      colors: result,
      requestedHarmony: harmonyType,
      actualHarmony: actualHarmonyType,
      fallbackUsed
    });
  } catch (error) {
    console.error("Error generating harmony:", error);
    return c.json({ error: "Failed to generate harmony" }, 500);
  }
});

export default app;
