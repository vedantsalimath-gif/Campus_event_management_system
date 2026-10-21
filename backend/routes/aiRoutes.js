
import express from "express";
import { GoogleGenAI } from "@google/genai";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import ProductionTeam from "../models/ProductionTeam.js";

const router = express.Router();
async function buildDatabaseFallback() {
  const [events, teams, registrationSummary] = await Promise.all([
    Event.find()
      .select("title startDate venue capacity status")
      .lean(),

    ProductionTeam.find()
      .populate("events", "title")
      .select("name department events")
      .lean(),

    Registration.aggregate([
      { $match: { status: "Registered" } },
      {
        $group: {
          _id: "$event",
          totalRegistrations: { $sum: 1 },
        },
      },
    ]),
  ]);

  const registrationCounts = new Map(
    registrationSummary.map((item) => [
      String(item._id),
      item.totalRegistrations,
    ])
  );

  const activeEvents = events.filter(
    (event) =>
      !["cancelled", "completed"].includes(
        String(event.status).toLowerCase()
      )
  );

  const recommendations = [];

  if (activeEvents.length === 0) {
    recommendations.push(
      "Review event records: no active or upcoming events were found. Confirm event statuses and dates."
    );
  }

  for (const event of activeEvents.slice(0, 3)) {
    const missing = [];

if (!event.venue || !String(event.venue).trim()) {
  missing.push("venue");
}

if (!event.startDate) {
  missing.push("start date");
}

if (event.capacity == null || event.capacity <= 0) {
  missing.push("valid event capacity");
}
    const registrations =
      registrationCounts.get(String(event._id)) || 0;

    const assignedTeams = teams.filter((team) =>
      (team.events || []).some(
        (assignedEvent) =>
          String(assignedEvent._id) === String(event._id)
      )
    );

    if (missing.length > 0) {
      recommendations.push(
        `${event.title}: complete the missing information — ${missing.join(", ")}.`
      );
    }

    if (
  typeof event.capacity === "number" &&
  event.capacity > 0
) {
  const availableSeats = event.capacity - registrations;

  if (availableSeats <= 0) {
    recommendations.push(
      `${event.title}: capacity is reached or exceeded (${registrations}/${event.capacity}). Review capacity before accepting more registrations.`
    );
  } else if (availableSeats <= Math.ceil(event.capacity * 0.1)) {
    recommendations.push(
      `${event.title}: ${registrations} of ${event.capacity} seats are currently registered, with ${availableSeats} seat(s) available. Confirm that the venue capacity is suitable for the expected audience.`
    );
  }
}

    if (assignedTeams.length === 0) {
      recommendations.push(
        `${event.title}: no production team is assigned in the database. Review staffing requirements.`
      );
    }
  }

  if (recommendations.length === 0) {
  recommendations.push(
    "Review event dates, venue readiness, registration counts, and production assignments before each event."
  );
}

if (recommendations.length < 3 && activeEvents.length > 0) {
  recommendations.push(
    "Verify registration records against each event's capacity before confirming attendance."
  );
}

if (recommendations.length < 3 && activeEvents.length > 0) {
  recommendations.push(
    "Confirm production-team responsibilities and equipment requirements before each event."
  );
}

  return [
    "### Database-Based Planning Recommendations",
    "",
    "Gemini is temporarily unavailable, so these recommendations were generated from current database records rather than by the AI model.",
    "",
    ...recommendations.slice(0, 5).map(
      (item, index) => `${index + 1}. ${item}`
    ),
    "",
    `**Database summary:** ${events.length} event(s), ${teams.length} production team(s), and ${registrationSummary.reduce((sum, item) => sum + item.totalRegistrations, 0)} active registration(s).`,
  ].join("\n");
}
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(ai, request) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      const message = String(error.message || error);

      const isTemporary =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("high demand");

      if (!isTemporary || attempt === 2) {
        throw error;
      }

      await sleep(1000 * (2 ** attempt));
    }
  }
}

router.post("/assistant", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key is missing from backend/.env",
      });
    }

    const { question, eventId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        message: "Please enter a question.",
      });
    }

    const [events, teams] = await Promise.all([
      Event.find()
        .select("title description category startDate endDate venue capacity status")
        .lean(),
      ProductionTeam.find()
        .populate("events", "title category startDate venue status")
        .select("name department description members events")
        .lean(),
    ]);

    const registrationSummary = await Registration.aggregate([
      { $match: { status: "Registered" } },
      {
        $group: {
          _id: "$event",
          totalRegistrations: { $sum: 1 },
        },
      },
    ]);

    const selectedEvent = eventId
      ? events.find((event) => event._id.toString() === eventId)
      : null;

    if (eventId && !selectedEvent) {
      return res.status(404).json({
        message: "Selected event was not found.",
      });
    }

    const context = {
      selectedEvent,
      events,
      teams: teams.map((team) => ({
        name: team.name,
        department: team.department,
        description: team.description,
        members: team.members.map((member) => ({
          name: member.name,
          role: member.role,
        })),
        assignedEvents: team.events.map((event) => event.title),
      })),
      registrationSummary: registrationSummary.map((item) => ({
        eventId: item._id.toString(),
        totalRegistrations: item.totalRegistrations,
      })),
    };

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await generateWithRetry(ai, {
      model: "gemini-3.8-flash",
       config: {
    maxOutputTokens: 400,
    temperature: 0.3,
  },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an AI Event Planning Assistant for a college event management system.
Use the supplied database context to answer the user's question.
Give practical, concise recommendations. Never invent event details, registrations, or team members.
Clearly label suggestions as recommendations, not confirmed facts.
If the database does not contain enough information, say so.

Give exactly 3 numbered recommendations.
Keep the entire answer under 150 words.
Use short, clear sentences.
Mention missing information separately.

DATABASE CONTEXT:
${JSON.stringify(context)}

USER QUESTION:
${question.trim()}`,
            },
          ],
        },
      ],
    });

    res.json({
      answer: response.text || "The AI did not return a response.",
    });
    } catch (error) {
    console.error("AI assistant error:", error.message);

    const message = String(error.message || error);

    const quotaOrTemporaryError =
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("high demand");

    if (quotaOrTemporaryError) {
      try {
        const answer = await buildDatabaseFallback();

        return res.json({
          answer,
          fallback: true,
          message: "Gemini is temporarily unavailable. Showing database-based recommendations.",
        });
      } catch (fallbackError) {
        console.error("Database fallback error:", fallbackError.message);
      }
    }

    return res.status(500).json({
      message: "The AI assistant could not process your request. Please try again.",
    });
  }
});

export default router;
