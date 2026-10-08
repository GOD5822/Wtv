==========================================================
 IDLE DICE - WITH ADMIN PANEL
==========================================================

HOW TO PLAY
-----------
1. Unzip this folder anywhere.
2. Best way to run it (recommended):
   - Open a terminal / command prompt in the "idle-dices" folder
   - Run:  python -m http.server 8000
   - Open: http://localhost:8000
3. Or simply double-click index.html (works in most browsers,
   but the server method above is the most reliable).

ADMIN PANEL
----------
- Hotkey: press the ` key (backtick, under Esc, above Tab)
  to open/close the admin panel. The apostrophe ' key also works.
- Password: PASSCODE  (exact, case-sensitive)
- The panel only stays unlocked until the page is reloaded.

WHAT THE ADMIN PANEL CAN DO
--------------------------
- Currencies : set / add / multiply any currency instantly
               (Points, Chips, Diamonds, Skillpoints, LuckPoints,
               BonusPoints, SlotSpins, CardsPoints, GoldenCardsPoints,
               DiamondCardPoints, DuelCups, CupPoints)
- Upgrades   : set any upgrade to any level for free - value and
               price are recalculated with the game's own formulas
- Values     : edit internal game values and multipliers live
- Locks      : unlock every locked feature (autoRoll, autoroll100,
               autoConvert, autoUpgrade, ...) with one click
- Game       : pause, disable/enable autosave, force save, reload
- Save Data  : full raw save editor (JSON), base64 export/import
               (compatible with the game's own save prompt),
               and a save reset
- Console    : run any JavaScript against the live game
               (full access to the Luts engine API)

NOTES
-----
- Your normal save data is kept in the browser's localStorage,
  same as the original game. Nothing is sent anywhere.
- Everything applies live - most actions need no reload.
- The admin panel is a convenience lock, not real security:
  it only gates the panel in your own browser.
