# Xaira Chemical Inventory Lookup

A simple static web app for lab end users to search the chemical inventory
and view the full EH&S record for any chemical.

## Using the app

Open `index.html` in a browser (or serve the folder with any static file
server — a browser opening the file directly may block `fetch()` for
`data/chemicals.json` under `file://`, so a local server is recommended):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Type a chemical name, CAS number, or inventory ID into the search box.
Click a result to see all recorded details: identification, quantity,
storage location, hazard information, SDS link, and dates/status.

## Updating the inventory data

The app reads from `data/chemicals.json`, which is generated from the
source workbook `data/Chemical_Inventory_EHS_Tracker_1.0.xlsx`. When EH&S
provides an updated workbook:

1. Replace `data/Chemical_Inventory_EHS_Tracker_1.0.xlsx` with the new file
   (keep the same filename, or pass the new path as an argument below).
2. Regenerate the JSON:

   ```bash
   pip install openpyxl
   python3 scripts/convert_inventory.py
   ```

3. Commit the updated `data/chemicals.json` (and workbook, if replaced).

## Project structure

```
index.html                  Search page markup
css/style.css                Styling
js/app.js                    Search + detail rendering logic
data/chemicals.json          Generated chemical records (used by the app)
data/Chemical_Inventory_EHS_Tracker_1.0.xlsx   Source workbook
scripts/convert_inventory.py Converts the workbook's Inventory sheet to JSON
```
