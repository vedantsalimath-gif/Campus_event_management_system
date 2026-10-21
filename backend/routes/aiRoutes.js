
import express from "express";
import OpenAI from "openai";
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
      } else if (
        availableSeats <= Math.ceil(event.capacity * 0.1)
      ) {
        recommendations.push(
          `${event.title}: ${registrations} of ${event.capacity} seats are registered, with ${availableSeats} seat(s) available. Review venue capacity.`
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

  if (recommendations.length < 3) {
    recommendations.push(
      "Verify registration records against each event's capacity before confirming attendance."
    );
  }

  if (recommendations.length < 3) {
    recommendations.push(
      "Confirm production-team responsibilities and equipment requirements before each event."
    );
  }

  const totalRegistrations = registrationSummary.reduce(
    (sum, item) => sum + item.totalRegistrations,
    0
  );

  return [
    "### Database-Based Planning Recommendations",
    "",
    "The AI service was unavailable, so these recommendations were generated from database records.",
    "",
    ...recommendations.slice(0, 5).map(
      (item, index) => `${index + 1}. ${item}`
    ),
    "",
    `**Database summary:** ${events.length} event(s), ${teams.length} production team(s), and ${totalRegistrations} registered participant(s).`,
  ].join("\n");
}

router.post("/assistant", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message:
          "OpenAI API key is missing from the backend environment.",
      });
    }

    const { question, eventId } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        message: "Please enter a question.",
      });
    }

    const [events, teams] = await Promise.all([
      Event.find()
        .select(
          "title description category startDate endDate venue capacity status"
        )
        .lean(),

      ProductionTeam.find()
        .populate(
          "events",
          "title category startDate venue status"
        )
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
      ? events.find(
          (event) => event._id.toString() === String(eventId)
        )
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

        members: (team.members || []).map((member) => ({
          name: member.name,
          role: member.role,
        })),

        assignedEvents: (team.events || []).map(
          (event) => event.title
        ),
      })),

      registrationSummary: registrationSummary.map((item) => ({
        eventId: String(item._id),
        totalRegistrations: item.totalRegistrations,
      })),
    };

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are an AI Event Planning Assistant for a college event management system.

Answer the user's question using the supplied database context.
Give practical, concise, actionable recommendations.
Never invent events, registration counts, or team members.
Distinguish recommendations from confirmed database facts.
If information is missing, explicitly say what is missing.

Give exactly 3 numbered recommendations when the question asks for recommendations.
For other questions, use the format best suited to the question.
Keep the answer under 200 words unless more detail is necessary.
Use short, clear sentences.

DATABASE CONTEXT:
${JSON.stringify(context)}

USER QUESTION:
${question.trim()}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const answer =
      response.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("OpenAI returned an empty response.");
    }

    return res.json({
      answer,
      fallback: false,
    });
  } catch (error) {
    console.error(
      "AI assistant error:",
      error.status || "",
      error.message || error
    );

    const status = Number(error.status);
    const message = String(error.message || error);

    const shouldUseFallback =
      [408, 429, 500, 502, 503, 504].includes(status) ||
      message.includes("ECONNRESET") ||
      message.includes("ETIMEDOUT");

    if (shouldUseFallback) {
      try {
        const answer = await buildDatabaseFallback();

        return res.json({
          answer,
          fallback: true,
          message:
            "OpenAI is temporarily unavailable. Showing database-based recommendations.",
        });
      } catch (fallbackError) {
        console.error(
          "Database fallback error:",
          fallbackError.message || fallbackError
        );
      }
    }

    return res.status(500).json({
      message:
        "The AI assistant could not process your request. Check the backend logs and API configuration.",
    });
  }
});

export default router;
