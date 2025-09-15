## WebSocket Protocol

Connect with auth token. Subscribe to rooms: chat:{id}, run:{id}. Messages have shape `{ event, ts, room, payload, seq }`. Clients acknowledge with last seen `seq` to support replay on reconnect. Heartbeats every 20s; server drops after 3 missed. Backpressure handled via bounded buffers and drop‑oldest for non‑critical events.


