const faker = require("faker");

module.exports = [
  {
    tags: ["proxy"],
    id: "localhost",
    value: "http://localhost:3000",
  },
  {
    tags: ["proxy"],
    id: "127.0.0.1",
    value: "http://127.0.0.1:80",
  },
  {
    tags: ["proxy"],
    id: "182.168.1.1",
    value: "http://182.168.1.1:80",
  },
  {
    tags: ["bot", "private"],
    id: "1234567890",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    deactivatedAt: faker.date.future(),
  },
  {
    tags: ["user-agent"],
    id: "0e3c42d8731d637c8191f37153908cf4",
    value:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:76.0) Gecko/20100101 Firefox/76.0",
  },
  {
    tags: ["bot"],
    id: "invalid_bot",
    value: null,
  },
  {
    tags: ["bot"],
    id: "deactivated_bot",
    value: null,
    deactivatedAt: new Date("2020-01-17T12:05:40.287Z"),
  },
];
