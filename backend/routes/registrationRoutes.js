
import express from "express";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

const router = express.Router();
console.log("Registration routes file loaded");

// GET: Fetch all registrations
router.get("/", async (req, res) => {
    console.log("GET /api/registrations reached");
  try {
    const registrations = await Registration.find()
      .populate("event", "title startDate venue capacity")
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch registrations for one event
router.get("/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const registrations = await Registration.find({
      event: eventId
    }).sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Register a participant for an event
router.post("/", async (req, res) => {
  try {
    const { eventId, participantName, email, contactNumber } = req.body;

    if (
      !eventId ||
      !mongoose.isValidObjectId(eventId) ||
      !participantName?.trim() ||
      !email?.trim()
    ) {
      return res.status(400).json({
        message: "A valid event ID, participant name and email are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Enter a valid email address"
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (["Cancelled", "Completed"].includes(event.status)) {
      return res.status(400).json({
        message: "This event is not accepting registrations"
      });
    }

    const existingRegistration = await Registration.findOne({
      event: eventId,
      email: normalizedEmail
    });

    if (existingRegistration) {
      return res.status(409).json({
        message: "This email is already registered for this event"
      });
    }

    const registeredCount = await Registration.countDocuments({
      event: eventId,
      status: "Registered"
    });

    if (registeredCount >= event.capacity) {
      return res.status(409).json({
        message: "This event has reached its capacity"
      });
    }

    const registration = await Registration.create({
      event: eventId,
      participantName: participantName.trim(),
      email: normalizedEmail,
      contactNumber: contactNumber?.trim() || ""
    });

    res.status(201).json({
      message: "Registration successful",
      registration
    });
  } catch (error) {
    // MongoDB duplicate-key protection
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered for this event"
      });
    }

    res.status(500).json({ message: error.message });
  }
});

 // PATCH: Cancel a registration without deleting its history
router.patch("/:id/cancel", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid registration ID"
      });
    }

    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found"
      });
    }

    if (registration.status === "Cancelled") {
      return res.status(400).json({
        message: "Registration is already cancelled"
      });
    }

    registration.status = "Cancelled";
    await registration.save();

    // Return the registration with its event details populated
    await registration.populate("event", "title startDate venue capacity");

    res.json({
      message: "Registration cancelled successfully",
      registration
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;