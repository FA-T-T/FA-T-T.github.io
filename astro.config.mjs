import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.everylink.site",
  integrations: [sitemap()],
  output: "static",
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});
