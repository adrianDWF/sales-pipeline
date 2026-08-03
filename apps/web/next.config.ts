import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@sales-pipeline/shared"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@mui/material",
      "@mui/icons-material",
      "date-fns",
      "recharts",
    ],
  },
};

export default nextConfig;
