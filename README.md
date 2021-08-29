# Skriptle
Skriptle is a reverse-engineered client for the protocol of https://skribbl.io, with some fun built-in scripts.

## Deobfuscated game code
Files:
- `src/deobf.js`

## Main client
Files:
- `src/client.js`
- `src/lobby-state.js`

## Discord invite spammer
Files:
- `src/discord-invite-spammer.js`

Running: `$ yarn discord-invite-spammer`

Env: `BOT_NAMES`, `CAPTCHA_TOKEN`, `DISCORD_LINK_ID`

---

This spammer makes use of these fatal vulnerabilities in the backend:
1. The spam counter gets fully reset once you join a new lobby
2. The game servers don't verify captcha tokens at all, which makes botting incredibly easy
3. Rate limiting (rejoin limiting) is done separately for each game server
4. One machine can play an unlimited amount of games at once
