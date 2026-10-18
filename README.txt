ElectrooBuddy admin pricing runtime fix

In PowerShell, extract the zip and run:
py .\apply_price_fix.py "C:\Users\RSP.tech Solution\Desktop\EB-migrate"

Then cd to your project and run npm run build.
Fixes numeric-string .toFixed calls on admin product cards and lists; does not modify database.
