
import express from "express";
import mongoose from "mongoose";
import Event from "../models/Event.js";

const router = express.Router();

// GET: Fetch all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create a new event
router.post("/", async (req, res) => {
  try {
    const { title, startDate, endDate, venue, capacity } = req.body;

    if (
      !title?.trim() ||
      !venue?.trim() ||
      !startDate ||
      !endDate ||
      capacity === undefined
    ) {
      return res.status(400).json({
        message: "Title, dates, venue and capacity are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const seats = Number(capacity);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start ||
      !Number.isInteger(seats) ||
      seats < 1
    ) {
      return res.status(400).json({
        message: "Enter valid dates and a positive whole-number capacity"
      });
    }

    const event = await Event.create({
      ...req.body,
      title: title.trim(),
      venue: venue.trim(),
      startDate: start,
      endDate: end,
      capacity: seats
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT: Update an existing event
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Remove an event
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
