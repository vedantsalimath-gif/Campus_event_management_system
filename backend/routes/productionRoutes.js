
import express from "express";
import mongoose from "mongoose";
import ProductionTeam from "../models/ProductionTeam.js";
import Event from "../models/Event.js";

const router = express.Router();

// GET: Fetch all production teams
router.get("/", async (req, res) => {
  try {
    const teams = await ProductionTeam.find()
      .populate("events", "title startDate venue status")
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch one production team
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const team = await ProductionTeam.findById(req.params.id)
      .populate("events", "title startDate venue status");

    if (!team) {
      return res.status(404).json({ message: "Production team not found" });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create a production team
router.post("/", async (req, res) => {
  try {
    const { name, department, description } = req.body;

    if (!name?.trim() || !department) {
      return res.status(400).json({
        message: "Team name and department are required",
      });
    }

    const team = await ProductionTeam.create({
      name: name.trim(),
      department,
      description: description?.trim() || "",
    });

    res.status(201).json({
      message: "Production team created successfully",
      team,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A team with this name already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
});

// PUT: Update a production team's details
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const { name, department, description } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Team name cannot be empty",
        });
      }
      updates.name = name.trim();
    }

    if (department !== undefined) updates.department = department;
    if (description !== undefined) updates.description = description.trim();

    const team = await ProductionTeam.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("events", "title startDate venue status");

    if (!team) {
      return res.status(404).json({ message: "Production team not found" });
    }

    res.json({
      message: "Production team updated successfully",
      team,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A team with this name already exists",
      });
    }

    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a production team
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const team = await ProductionTeam.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Production team not found" });
    }

    res.json({ message: "Production team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add a member to a production team
router.post("/:id/members", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const { name, email, role, responsibilities } = req.body;

    if (!name?.trim() || !role?.trim()) {
      return res.status(400).json({
        message: "Member name and role are required",
      });
    }

    const team = await ProductionTeam.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Production team not found" });
    }

    team.members.push({
      name: name.trim(),
      email: email?.trim().toLowerCase() || "",
      role: role.trim(),
      responsibilities: responsibilities?.trim() || "",
    });

    await team.save();

    res.status(201).json({
      message: "Team member added successfully",
      team,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Remove a member from a production team
router.delete("/:id/members/:memberId", async (req, res) => {
  try {
    const { id, memberId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(memberId)
    ) {
      return res.status(400).json({
        message: "Invalid team or member ID",
      });
    }

    const team = await ProductionTeam.findById(id);

    if (!team) {
      return res.status(404).json({ message: "Production team not found" });
    }

    const member = team.members.id(memberId);

    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    member.deleteOne();
    await team.save();

    res.json({
      message: "Team member removed successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Assign an event to a production team
router.post("/:id/events/:eventId", async (req, res) => {
  try {
    const { id, eventId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(eventId)
    ) {
      return res.status(400).json({
        message: "Invalid team or event ID",
      });
    }

    const [team, event] = await Promise.all([
      ProductionTeam.findById(id),
      Event.findById(eventId),
    ]);

    if (!team) {
      return res.status(404).json({ message: "Production team not found" });
    }

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (["Cancelled", "Completed"].includes(event.status)) {
      return res.status(400).json({
        message: "Cannot assign a team to a cancelled or completed event",
      });
    }

    if (team.events.some((existingId) => existingId.equals(eventId))) {
      return res.status(409).json({
        message: "This event is already assigned to the team",
      });
    }

   team.events.push(eventId);
await team.save();

console.log("ASSIGNMENT DEBUG:", {
  database: mongoose.connection.name,
  teamId: team._id.toString(),
  assignedEvents: team.events.map((id) => id.toString()),
});

    const updatedTeam = await ProductionTeam.findById(id)
      .populate("events", "title startDate venue status");

    res.json({
      message: "Event assigned to production team successfully",
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: Remove an event assignment from a production team
router.delete("/:id/events/:eventId", async (req, res) => {
  try {
    const { id, eventId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(eventId)
    ) {
      return res.status(400).json({
        message: "Invalid team or event ID",
      });
    }

    const team = await ProductionTeam.findById(id);

    if (!team) {
      return res.status(404).json({ message: "Production team not found" });
    }

    const originalCount = team.events.length;

    team.events = team.events.filter(
      (existingId) => !existingId.equals(eventId)
    );

    if (team.events.length === originalCount) {
      return res.status(404).json({
        message: "This event is not assigned to the team",
      });
    }

    await team.save();

    res.json({ message: "Event assignment removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
