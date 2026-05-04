import { Router } from "express";

const router = Router();

router.post("/hotel-recommendation", (req, res) => {
  req.url = "/api/ai/hotel-recommendation";
  req.app.handle(req, res);
});

router.post("/booking", (req, res) => {
  req.url = "/api/ai/booking";
  req.app.handle(req, res);
});

router.post("/booking/stream", (req, res) => {
  req.url = "/api/ai/booking/stream";
  req.app.handle(req, res);
});

export default router;