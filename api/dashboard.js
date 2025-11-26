import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
  try {
    // Read the dashboard HTML file
    const dashboardPath = path.join(__dirname, '../dashboard.html');
    const html = fs.readFileSync(dashboardPath, 'utf8');

    // Set proper headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Send the HTML
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard', message: error.message });
  }
}
