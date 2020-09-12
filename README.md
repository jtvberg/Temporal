# Temporal
 Transient Note Taking and full screen annotation.
 Only 6 note 'pads'
 Tray resident only.
 Saves to local storage (no import/export.)
 Can be locked to stay on top of other windows.
 Toggle into sketch mode to free draw.
 Double-click the header to maximize and go into full screen/transparent mode to annotate docs. (Primary use-case is for telecommunication where you may want to mark-up a shared document for discussion.)

#### Main Screen with Notes and Sketches:
<img src="/screenshots/temporal_main.png" width="250"/>

## Using the code
    Clone repo
    Provided instructions assume you are using npm as your package manager
    Code has not been tested with other package managers such as Yarn
    Navigate to directory and run 'npm install' to install dependencies

## Running the code
    Some npm scripts are already setup in package.json
    'npm start' will launch the app (alternatively you can use 'electron .')
    You can uncomment the dev tools load on start up in main.js (~webContents.openDevTools())
    To debug main.js you can use the following commands (assumes you are using npm):
    'npm run debug' will launch in main process debug mode on port 7070
    'npm run break' will launch the app and break at entry point also on port 7070
    Use chrome://inspect and configure the target with above port