Production Update — To-Do List for Tomorrow
Step 1 — Commit & Push (on your local machine)

git add server/src/models/stockReportModel.js \
 server/src/models/stockAdjModel.js \
 server/src/controllers/stockAdjController.js \
 server/src/routes/stockAdjRoute.js \
 server/src/routes/index.js \
 client/src/pages/StockAdjPage.jsx \
 client/src/services/stockAdjService.js \
 client/src/router/routes.jsx \
 client/src/pages/StockReportPage.jsx
git commit -m "feat: add stock adjustments and include adj in balance/movements"
git push origin review-existing-code
Step 2 — Fix the Database (do this FIRST before anything else)
Run this SQL on the production database via phpMyAdmin:

ALTER TABLE stkadjlines
MODIFY stkadjlinesid INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY;
This is required or saving adjustments will fail with a 500 error.

Step 3 — Build the Frontend

cd client
npm run build
Step 4 — Upload Files via cPanel File Manager / FTP
Frontend → domains/tcplsys.primeapps.sg/public_html/

Upload all contents of client/dist/
Backend → domains/api.tcplsys.primeapps.sg/server/src/

Local file Upload to
server/src/models/stockReportModel.js .../server/src/models/
server/src/models/stockAdjModel.js .../server/src/models/
server/src/controllers/stockAdjController.js .../server/src/controllers/
server/src/routes/stockAdjRoute.js .../server/src/routes/
server/src/routes/index.js .../server/src/routes/
Step 5 — Restart the API App
cPanel → Setup Node.js App → api.tcplsys.primeapps.sg → Restart

Step 6 — Verify
Login and navigate to Stocks → Adjustments — should show non-Service products
Load a balance, enter a physical count, save — should succeed
Navigate to Stocks → Reports — balance table should have the new Adj column
Movements filter should include Stock Adjustment as a type option
Good rest! Everything is ready to deploy tomorrow.
