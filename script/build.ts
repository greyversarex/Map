import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, access } from "fs/promises";
import { constants } from "fs";

const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  try {
    console.log("=== Starting build process ===");
    
    console.log("Step 1: Cleaning dist folder...");
    await rm("dist", { recursive: true, force: true });
    console.log("✓ dist folder cleaned");

    console.log("Step 2: Building client with Vite...");
    await viteBuild();
    console.log("✓ Client build complete");

    console.log("Step 3: Building server with esbuild...");
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const allDeps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
    const externals = allDeps.filter((dep) => !allowlist.includes(dep));

    await esbuild({
      entryPoints: ["server/index.ts"],
      platform: "node",
      bundle: true,
      format: "cjs",
      outfile: "dist/index.cjs",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      external: externals,
      logLevel: "info",
    });
    console.log("✓ Server build complete");

    console.log("Step 4: Verifying dist/index.cjs exists...");
    try {
      await access("dist/index.cjs", constants.F_OK);
      console.log("✓ dist/index.cjs verified");
    } catch {
      throw new Error("dist/index.cjs was not created!");
    }

    console.log("=== Build completed successfully! ===");
  } catch (err) {
    console.error("=== BUILD FAILED ===");
    console.error(err);
    process.exit(1);
  }
}

buildAll();
