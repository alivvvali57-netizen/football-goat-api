const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const KEY = process.env.HIGHLIGHTLY_KEY;

function send(res, status, data) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}

function proxy(res, target) {
  const request = https.get(target, {
    headers: {
      "x-rapidapi-key": KEY
    }
  }, apiRes => {
    let body = "";

    apiRes.on("data", chunk => {
      body += chunk;
    });

    apiRes.on("end", () => {
      res.writeHead(apiRes.statusCode || 500, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(body);
    });
  });

  request.on("error", error => {
    send(res, 500, {
      error: error.message
    });
  });
}

const server = http.createServer((req, res) => {

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });

    return res.end();
  }

  const url = new URL(
    req.url,
    `http://${req.headers.host}`
  );

  if (url.pathname === "/") {
    return send(res, 200, {
      status: "Football Goat API is working"
    });
  }

  if (!KEY) {
    return send(res, 500, {
      error: "HIGHLIGHTLY_KEY is not configured"
    });
  }

  if (url.pathname === "/matches") {
    const date = url.searchParams.get("date");

    if (!date) {
      return send(res, 400, {
        error: "Missing date"
      });
    }

    const target =
      "https://soccer.highlightly.net/matches" +
      "?date=" + encodeURIComponent(date) +
      "&timezone=Asia/Baghdad" +
      "&limit=100";

    return proxy(res, target);
  }

  if (url.pathname === "/box-score") {
    const id = url.searchParams.get("id");

    if (!id) {
      return send(res, 400, {
        error: "Missing match id"
      });
    }

    const target =
      "https://soccer.highlightly.net/box-score/" +
      encodeURIComponent(id);

    return proxy(res, target);
  }

  return send(res, 404, {
    error: "Not found"
  });
});

server.listen(PORT, () => {
  console.log(
    `Football Goat API listening on port ${PORT}`
  );
});
