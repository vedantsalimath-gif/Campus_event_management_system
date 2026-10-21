
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clapperboard,
  MapPin,
  Sparkles,
  Plus,
  Search,
  Bell,
  Clock3,
  Ticket,
  X,
  Trash2,
  RefreshCw,
  Pencil,
  CheckCircle,
} from "lucide-react";
import "./App.css";

const API = "https://campus-event-management-system-4cnr.onrender.com/api/events";
const REGISTRATION_API = "https://campus-event-management-system-4cnr.onrender.com/api/registrations";
const PRODUCTION_API = "https://campus-event-management-system-4cnr.onrender.com/api/production";

const emptyEventForm = {
  title: "",
  description: "",
  category: "Cultural",
  startDate: "",
  endDate: "",
  venue: "",
  capacity: 100,
};

const emptyRegistrationForm = {
  eventId: "",
  participantName: "",
  email: "",
  contactNumber: "",
};

async function readResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }
  return data;
}

function App() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [productionTeams, setProductionTeams] = useState([]);
  const [productionLoading, setProductionLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiFallback, setAiFallback] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [productionError, setProductionError] = useState("");
  
const [productionForm, setProductionForm] = useState({
  name: "",
  department: "Camera",
  description: "",
});

const [showProductionForm, setShowProductionForm] = useState(false);
const [editingTeamId, setEditingTeamId] = useState(null);
const [productionSubmitting, setProductionSubmitting] = useState(false);

const [showMemberForm, setShowMemberForm] = useState(false);
const [selectedTeamId, setSelectedTeamId] = useState(null);

const [showAssignEventForm, setShowAssignEventForm] = useState(false);
const [selectedEventId, setSelectedEventId] = useState("");
const [assigningEvent, setAssigningEvent] = useState(false);

const [memberSubmitting, setMemberSubmitting] = useState(false);

const [memberForm, setMemberForm] = useState({
  name: "",
  email: "",
  role: "",
  responsibilities: "",
});


  const [activeSection, setActiveSection] = useState("dashboard");
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [showEventForm, setShowEventForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [registrationForm, setRegistrationForm] =
    useState(emptyRegistrationForm);
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false);

  
  async function askAI(e) {
  e.preventDefault();

  if (!aiQuestion.trim()) {
    setAiError("Please enter a question.");
    return;
  }

  setAiLoading(true);
  setAiError("");
  setAiAnswer("");

  try {
    setAiFallback(false);
    const response = await fetch(
      "https://campus-event-management-system-4cnr.onrender.com/api/ai/assistant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: aiQuestion.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "AI request failed.");
    }

    setAiAnswer(data.answer || "The AI returned no answer.");
    setAiFallback(Boolean(data.fallback));
  } catch (error) {
    setAiError(error.message || "Could not contact the AI assistant.");
  } finally {
    setAiLoading(false);
  }
}
  
  
  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);
      const data = await readResponse(response, "Unable to load events.");
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Cannot connect to the backend. Make sure your server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations() {
    setRegistrationsLoading(true);
    setRegistrationsError("");

    try {
      const response = await fetch(REGISTRATION_API);
      const data = await readResponse(
        response,
        "Unable to load registrations."
      );
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      setRegistrationsError(
        err.message || "Could not connect to the registrations API."
      );
    } finally {
      setRegistrationsLoading(false);
    }
  }
  
async function loadProductionTeams() {
  setProductionLoading(true);
  setProductionError("");

  try {
    const response = await fetch(PRODUCTION_API);
    const data = await readResponse(
      response,
      "Unable to load production teams."
    );

    setProductionTeams(Array.isArray(data) ? data : []);
  } catch (err) {
    setProductionError(
      err.message || "Could not connect to the production API."
    );
  } finally {
    setProductionLoading(false);
  }
}


async function saveProductionTeam(e) {
  e.preventDefault();
  setProductionError("");
  setNotice("");

  const payload = {
    name: productionForm.name.trim(),
    department: productionForm.department,
    description: productionForm.description.trim(),
  };

  if (!payload.name) {
    setProductionError("Team name is required.");
    return;
  }

  setProductionSubmitting(true);

  try {
    const response = await fetch(
      editingTeamId
        ? `${PRODUCTION_API}/${editingTeamId}`
        : PRODUCTION_API,
      {
        method: editingTeamId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    await readResponse(
      response,
      editingTeamId
        ? "Unable to update production team."
        : "Unable to create production team."
    );

    setShowProductionForm(false);
    setEditingTeamId(null);
    setProductionForm({
      name: "",
      department: "Camera",
      description: "",
    });

    setNotice(
      editingTeamId
        ? "Production team updated successfully."
        : "Production team created successfully."
    );

    await loadProductionTeams();
  } catch (err) {
    setProductionError(
      err.message || "Could not save the production team."
    );
  } finally {
    setProductionSubmitting(false);
  }
}


async function addProductionMember(e) {
  e.preventDefault();

  if (!selectedTeamId) return;

  setMemberSubmitting(true);
  setProductionError("");
  setNotice("");

  try {
    const response = await fetch(
      `${PRODUCTION_API}/${selectedTeamId}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memberForm),
      }
    );

    await readResponse(
      response,
      "Unable to add team member."
    );

    setNotice("Team member added successfully.");
    setShowMemberForm(false);

    setMemberForm({
      name: "",
      email: "",
      role: "",
      responsibilities: "",
    });

    await loadProductionTeams();
  } catch (err) {
    setProductionError(
      err.message || "Could not add team member."
    );
  } finally {
    setMemberSubmitting(false);
  }
}


async function assignProductionEvent(e) {
  e.preventDefault();

  if (!selectedTeamId || !selectedEventId) {
    setProductionError("Please select an event.");
    return;
  }

  setAssigningEvent(true);
  setProductionError("");
  setNotice("");

  try {
    const response = await fetch(
      `${PRODUCTION_API}/${selectedTeamId}/events/${selectedEventId}`,
      { method: "POST" }
    );

    await readResponse(response, "Unable to assign event.");

    setNotice("Event assigned successfully.");
    setShowAssignEventForm(false);
    setSelectedEventId("");

    await loadProductionTeams();
  } catch (err) {
    setProductionError(
      err.message || "Could not assign event."
    );
  } finally {
    setAssigningEvent(false);
  }
}


  useEffect(() => {
    loadEvents();
  }, []);

  async function cancelRegistration(id) {
    if (!window.confirm("Are you sure you want to cancel this registration?")) {
      return;
    }

    setRegistrationsError("");

    try {
      const response = await fetch(`${REGISTRATION_API}/${id}/cancel`, {
        method: "PATCH",
      });

      await readResponse(response, "Could not cancel registration.");
      await loadRegistrations();
      setNotice("Registration cancelled successfully.");
    } catch (err) {
      setRegistrationsError(err.message || "Could not cancel registration.");
    }
  }

  async function registerParticipant(e) {
    e.preventDefault();
    setRegistrationsError("");
    setNotice("");

    if (!registrationForm.eventId) {
      setRegistrationsError("Please select an event.");
      return;
    }

    setRegistrationSubmitting(true);

    try {
      const response = await fetch(REGISTRATION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: registrationForm.eventId,
          participantName: registrationForm.participantName.trim(),
          email: registrationForm.email.trim(),
          contactNumber: registrationForm.contactNumber.trim(),
        }),
      });

      await readResponse(response, "Registration failed.");

      setRegistrationForm(emptyRegistrationForm);
      setShowRegistrationForm(false);
      setNotice("Participant registered successfully.");
      await loadRegistrations();
    } catch (err) {
      setRegistrationsError(err.message || "Could not register participant.");
    } finally {
      setRegistrationSubmitting(false);
    }
  }

  function openCreateEventForm() {
    setEditingEventId(null);
    setEventForm(emptyEventForm);
    setError("");
    setNotice("");
    setShowEventForm(true);
  }

  function openEditEventForm(event) {
    setEditingEventId(event._id);
    setError("");
    setNotice("");

    setEventForm({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "Cultural",
      startDate: event.startDate
        ? new Date(event.startDate).toISOString().slice(0, 16)
        : "",
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().slice(0, 16)
        : "",
      venue: event.venue || "",
      capacity: event.capacity ?? 100,
    });

    setShowEventForm(true);
  }

  async function saveEvent(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    const isEditing = Boolean(editingEventId);

    try {
      const response = await fetch(
        isEditing ? `${API}/${editingEventId}` : API,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...eventForm,
            capacity: Number(eventForm.capacity),
          }),
        }
      );

      const data = await readResponse(
        response,
        isEditing ? "Could not update event." : "Could not create event."
      );

      const savedEvent = data.event || data;

      if (isEditing) {
        setEvents((previous) =>
          previous.map((event) =>
            event._id === editingEventId ? savedEvent : event
          )
        );
        setNotice("Event updated successfully.");
      } else {
        setEvents((previous) => [...previous, savedEvent]);
        setNotice("Event created successfully.");
      }

      setShowEventForm(false);
      setEditingEventId(null);
      setEventForm(emptyEventForm);
      await loadEvents();
    } catch (err) {
      setError(err.message || "Could not save event.");
    }
  }

  async function updateEventStatus(id, status) {
    const action =
      status === "Cancelled" ? "cancel this event" : "mark this event as completed";

    if (!window.confirm(`Are you sure you want to ${action}?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      await readResponse(response, "Failed to update event status.");

      await loadEvents();
      setNotice(
        status === "Cancelled"
          ? "Event cancelled successfully."
          : "Event marked as completed successfully."
      );
    } catch (err) {
      setError(err.message || "Could not update event status.");
    }
  }

  async function deleteEvent(id) {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      await readResponse(response, "Could not delete event.");

      setEvents((previous) => previous.filter((event) => event._id !== id));
      setNotice("Event deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete event.");
    }
  }

  const filteredEvents = events.filter((event) => {
    const text = `${event.title || ""} ${event.venue || ""} ${
      event.description || ""
    }`;

    return (
      text.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All" || event.category === category)
    );
  });

  const upcoming = events.filter(
    (event) => event.status === "Upcoming"
  ).length;

  const totalCapacity = events.reduce(
    (sum, event) => sum + (Number(event.capacity) || 0),
    0
  );

  const registerableEvents = events.filter(
    (event) => !["Cancelled", "Completed"].includes(event.status)
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <CalendarDays size={23} />
          </div>
          <div>
            <strong>CampusConnect</strong>
            <span>EVENTS &amp; PRODUCTION</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="nav-links">
          <a href="#dashboard" className="nav-link active">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a href="#events" className="nav-link">
            <CalendarDays size={18} /> Events
          </a>
          

<a
  href="#production"
  className={`nav-link ${activeSection === "production" ? "active" : ""}`}
  onClick={() => {
    setActiveSection("production");
    loadProductionTeams();
  }}
>
  <Clapperboard size={18} /> Production
</a>


          <a
            href="#registrations"
            className="nav-link"
            onClick={() => loadRegistrations()}
          >
            <Users size={18} /> Registrations
          </a>
          <a
  href="#ai-assistant"
  className={`nav-link ${
    activeSection === "ai-assistant" ? "active" : ""
  }`}
  onClick={() => setActiveSection("ai-assistant")}
>
  <Sparkles size={18} />
  AI Assistant
</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <Clapperboard size={21} />
            <strong>Make it happen.</strong>
            <p>Every great campus moment starts with a plan.</p>
          </div>

          <div className="profile">
            <div className="avatar">CC</div>
            <div>
              <strong>Event Organizer</strong>
              <span>Campus administrator</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>
          <div className="top-actions">
            <span className="live-status">
              <span /> API workspace
            </span>
            <Bell size={19} />
            <div className="avatar">CC</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">CAMPUS EVENT MANAGEMENT</div>
              <h1>
                Your campus, <span>in motion.</span>
              </h1>
              <p className="subtitle">
                Plan events, coordinate crews, and bring every idea to life.
              </p>
            </div>

            <button className="primary-button" onClick={openCreateEventForm}>
              <Plus size={18} /> Create event
            </button>
          </div>

          {error && <div className="alert error-alert">{error}</div>}
          {notice && <div className="alert success-alert">{notice}</div>}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>Total events</span>
                <CalendarDays />
              </div>
              <div className="stat-value">{events.length}</div>
              <div className="stat-foot">Events in your workspace</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Upcoming events</span>
                <Clock3 />
              </div>
              <div className="stat-value">{upcoming}</div>
              <div className="stat-foot">Scheduled and upcoming</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Participant capacity</span>
                <Users />
              </div>
              <div className="stat-value">
                {totalCapacity.toLocaleString()}
              </div>
              <div className="stat-foot">Combined event capacity</div>
            </article>
          </section>
        

          <section className="events-section" id="events">
            <div className="section-heading">
              <div>
                <h2>Campus events</h2>
                <p>Everything happening in one place.</p>
              </div>

              <button
                className="secondary-button"
                onClick={loadEvents}
                disabled={loading}
              >
                <RefreshCw size={15} />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="toolbar">
              <label className="search-box">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events, venues..."
                />
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
              >
                {[
                  "All",
                  "Cultural",
                  "Technical",
                  "Workshop",
                  "Sports",
                  "Theatre",
                  "Other",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All categories" : item}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="empty-state">Loading campus events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Ticket size={25} />
                </div>
                <h3>
                  {events.length
                    ? "No matching events"
                    : "Your next great event starts here"}
                </h3>
                <p>
                  {events.length
                    ? "Try another search or category."
                    : "Create an event to see it appear on your dashboard."}
                </p>
                {!events.length && (
                  <button
                    className="primary-button"
                    onClick={openCreateEventForm}
                  >
                    <Plus size={18} /> Create your first event
                  </button>
                )}
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <article className="event-card" key={event._id}>
                    <div
                      className={`event-banner banner-${(
                        event.category || "other"
                      ).toLowerCase()}`}
                    >
                      <div className="banner-icon">
                        <CalendarDays size={25} />
                      </div>
                      <span className="status-pill">{event.status}</span>
                      <span className="category-label">{event.category}</span>
                    </div>

                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p className="event-description">
                        {event.description || "No description provided."}
                      </p>

                      <div className="event-meta">
                        <CalendarDays size={16} />
                        <span>
                          {event.startDate
                            ? new Date(event.startDate).toLocaleString()
                            : "Date unavailable"}
                        </span>
                      </div>

                      <div className="event-meta">
                        <MapPin size={16} />
                        <span>{event.venue}</span>
                      </div>

                      <div className="event-footer">
                        <span>
                          <Users size={16} /> Capacity: {event.capacity}
                        </span>

                        <div className="event-actions">
                          {event.status !== "Cancelled" &&
                            event.status !== "Completed" && (
                              <>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() => openEditEventForm(event)}
                                >
                                  <Pencil size={14} /> Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() =>
                                    updateEventStatus(event._id, "Cancelled")
                                  }
                                >
                                  <X size={14} /> Cancel Event
                                </button>

                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() =>
                                    updateEventStatus(event._id, "Completed")
                                  }
                                >
                                  <CheckCircle size={14} /> Mark Completed
                                </button>
                              </>
                            )}

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => deleteEvent(event._id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          
<section className="events-section" id="production">
 
<div className="section-heading">
  <div>
    <h2>Production teams</h2>
    <p>Manage your production crew and assigned events.</p>
  </div>

  <div className="event-actions">
    <button
      className="primary-button"
      onClick={() => {
        setProductionError("");
        setNotice("");
        setProductionForm({
          name: "",
          department: "Camera",
          description: "",
        });
        setEditingTeamId(null);
        setShowProductionForm(true);
      }}
    >
      <Plus size={17} /> Create team
    </button>

    <button
      className="secondary-button"
      onClick={loadProductionTeams}
      disabled={productionLoading}
    >
      <RefreshCw size={15} />
      {productionLoading ? "Loading..." : "Refresh"}
    </button>
  </div>
</div>


{showProductionForm && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h2>{editingTeamId ? "Edit Production Team" : "Create Production Team"}</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowProductionForm(false)}
        >
          Close
        </button>
      </div>

      <form onSubmit={saveProductionTeam}>
        <label htmlFor="production-name">Team name</label>
        <input
          id="production-name"
          type="text"
          value={productionForm.name}
          onChange={(e) =>
            setProductionForm({
              ...productionForm,
              name: e.target.value,
            })
          }
          placeholder="e.g. Camera and Video Team"
          required
        />

        <label htmlFor="production-department">Department</label>
        <select
          id="production-department"
          value={productionForm.department}
          onChange={(e) =>
            setProductionForm({
              ...productionForm,
              department: e.target.value,
            })
          }
        >
          {[
            "Direction",
            "Acting",
            "Camera",
            "Video Editing",
            "Sound",
            "Stage Management",
            "Social Media",
            "Production",
            "Other",
          ].map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        <label htmlFor="production-description">Description</label>
        <textarea
          id="production-description"
          value={productionForm.description}
          onChange={(e) =>
            setProductionForm({
              ...productionForm,
              description: e.target.value,
            })
          }
          placeholder="Describe the team's responsibilities"
          rows={3}
        />

        {productionError && (
          <p className="error-message">{productionError}</p>
        )}

        <div className="event-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowProductionForm(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={productionSubmitting}
          >
            {productionSubmitting
              ? "Saving..."
              : editingTeamId
                ? "Save changes"
                : "Create team"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


{showMemberForm && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h2>Add Team Member</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowMemberForm(false)}
        >
          Close
        </button>
      </div>

      <form onSubmit={addProductionMember}>
        <label htmlFor="member-name">Full Name</label>
        <input
          id="member-name"
          type="text"
          required
          value={memberForm.name}
          onChange={(e) =>
            setMemberForm({
              ...memberForm,
              name: e.target.value,
            })
          }
          placeholder="Enter member name"
        />

        <label htmlFor="member-email">Email</label>
        <input
          id="member-email"
          type="email"
          value={memberForm.email}
          onChange={(e) =>
            setMemberForm({
              ...memberForm,
              email: e.target.value,
            })
          }
          placeholder="Enter email address"
        />

        <label htmlFor="member-role">Role</label>
        <input
          id="member-role"
          type="text"
          required
          value={memberForm.role}
          onChange={(e) =>
            setMemberForm({
              ...memberForm,
              role: e.target.value,
            })
          }
          placeholder="e.g. Camera Operator"
        />

        <label htmlFor="member-responsibilities">
          Responsibilities
        </label>
        <textarea
          id="member-responsibilities"
          value={memberForm.responsibilities}
          onChange={(e) =>
            setMemberForm({
              ...memberForm,
              responsibilities: e.target.value,
            })
          }
          placeholder="Describe responsibilities"
          rows={3}
        />

        {productionError && (
          <p className="error-message">{productionError}</p>
        )}

        <div className="event-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowMemberForm(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={memberSubmitting}
          >
            {memberSubmitting ? "Adding..." : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


{showAssignEventForm && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h2>Assign Event</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowAssignEventForm(false)}
        >
          Close
        </button>
      </div>

      <form onSubmit={assignProductionEvent}>
        <label htmlFor="assign-event">
          Select Event
        </label>

        <select
          id="assign-event"
          required
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          <option value="">Choose an event</option>

          {events
            .filter(
              (event) =>
                !["Cancelled", "Completed"].includes(event.status)
            )
            .map((event) => (
              <option key={event._id} value={event._id}>
                {event.title} — {event.venue}
              </option>
            ))}
        </select>

        {productionError && (
          <p className="error-message">{productionError}</p>
        )}

        <div className="event-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowAssignEventForm(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={assigningEvent || !selectedEventId}
          >
            {assigningEvent ? "Assigning..." : "Assign Event"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


  {productionError && (
    <div className="alert error-alert">{productionError}</div>
  )}

  {productionLoading ? (
    <div className="empty-state">Loading production teams...</div>
  ) : productionTeams.length === 0 ? (
    <div className="empty-state">
      <div className="empty-icon">
        <Clapperboard size={25} />
      </div>
      <h3>No production teams found</h3>
      <p>Create a team using the production API and refresh this page.</p>
    </div>
  ) : (
    <div className="events-grid">
      {productionTeams.map((team) => (
        <article className="event-card" key={team._id}>
          <div className="event-banner banner-other">
            <div className="banner-icon">
              <Clapperboard size={25} />
            </div>
            <span className="category-label">{team.department}</span>
          </div>

          <div className="event-details">
            
            
<div className="event-actions">
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      setProductionForm({
        name: team.name || "",
        department: team.department || "Other",
        description: team.description || "",
      });
      setEditingTeamId(team._id);
      setProductionError("");
      setShowProductionForm(true);
    }}
  >
    <Pencil size={15} /> Edit
  </button>

  
<button
  type="button"
  className="secondary-button"
  onClick={() => {
    setSelectedTeamId(team._id);
    setMemberForm({
      name: "",
      email: "",
      role: "",
      responsibilities: "",
    });
    setProductionError("");
    setShowMemberForm(true);
  }}
>
  <Plus size={14} /> Add Member
</button>


<button
  type="button"
  className="secondary-button"
  onClick={() => {
    setSelectedTeamId(team._id);
    setSelectedEventId("");
    setProductionError("");
    setShowAssignEventForm(true);
  }}
>
  <CalendarDays size={14} /> Assign Event
</button>


  <button
    type="button"
    className="secondary-button"
    onClick={async () => {
      const confirmed = window.confirm(
        `Delete "${team.name}"? This action cannot be undone.`
      );
      if (!confirmed) return;

      setProductionError("");
      setNotice("");

      try {
        const response = await fetch(
          `${PRODUCTION_API}/${team._id}`,
          { method: "DELETE" }
        );

        await readResponse(response, "Unable to delete team.");
        setNotice("Production team deleted successfully.");
        await loadProductionTeams();
      } catch (err) {
        setProductionError(
          err.message || "Could not delete production team."
        );
      }
    }}
  >
    <Trash2 size={15} /> Delete
  </button>
</div>


            <h3>{team.name}</h3>
            <p className="event-description">
              {team.description || "No description provided."}
            </p>

            <h4>Team members ({team.members?.length || 0})</h4>

            {team.members?.length ? (
           
team.members.map((member) => (
  <div
    key={member._id}
    className="event-meta production-member-row"
  >
    <Users size={16} />

    <span className="production-member-info">
      <strong>{member.name}</strong> — {member.role}
      {member.email && ` (${member.email})`}
    </span>

    <button
      type="button"
      className="secondary-button production-remove-button"
      onClick={async () => {
        const confirmed = window.confirm(
          `Remove ${member.name} from ${team.name}?`
        );

        if (!confirmed) return;

        setProductionError("");
        setNotice("");

        try {
          const response = await fetch(
            `${PRODUCTION_API}/${team._id}/members/${member._id}`,
            { method: "DELETE" }
          );

          await readResponse(response, "Unable to remove team member.");

          setNotice(`${member.name} removed successfully.`);
          await loadProductionTeams();
        } catch (err) {
          setProductionError(
            err.message || "Could not remove team member."
          );
        }
      }}
    >
      <Trash2 size={14} /> Remove
    </button>
  </div>
))

            ) : (
              <p>No members added yet.</p>
            )}

            <h4>Assigned events ({team.events?.length || 0})</h4>

            {team.events?.length ? (
              
team.events.map((event) => (
  <div
    key={event._id}
    className="event-meta production-member-row"
  >
    <CalendarDays size={16} />

    <span className="production-member-info">
      <strong>{event.title}</strong>
      {" — "}{event.venue}
      {" ("}{event.status}{")"}
    </span>

    <button
      type="button"
      className="secondary-button production-remove-button"
      onClick={async () => {
        const confirmed = window.confirm(
          `Unassign "${event.title}" from "${team.name}"?`
        );

        if (!confirmed) return;

        setProductionError("");
        setNotice("");

        try {
          const response = await fetch(
            `${PRODUCTION_API}/${team._id}/events/${event._id}`,
            { method: "DELETE" }
          );

          await readResponse(response, "Unable to unassign event.");

          setNotice(`${event.title} unassigned successfully.`);
          await loadProductionTeams();
        } catch (err) {
          setProductionError(
            err.message || "Could not unassign event."
          );
        }
      }}
    >
      <Trash2 size={14} /> Unassign
    </button>
  </div>
))

            ) : (
              <p>No events assigned yet.</p>
            )}
          </div>
        </article>
      ))}
    </div>
  )}
</section>


          <section className="events-section" id="registrations">
            <div className="section-heading">
              <div>
                <h2>Event registrations</h2>
                <p>Manage participants registered for your campus events.</p>
              </div>

              <div className="event-actions">
                <button
                  className="primary-button"
                  onClick={() => {
                    setRegistrationsError("");
                    setNotice("");
                    setRegistrationForm(emptyRegistrationForm);
                    setShowRegistrationForm(true);
                  }}
                >
                  <Plus size={17} /> Register participant
                </button>

                <button
                  className="secondary-button"
                  onClick={loadRegistrations}
                  disabled={registrationsLoading}
                >
                  <RefreshCw size={15} />
                  {registrationsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {registrationsError && (
              <div className="alert error-alert">{registrationsError}</div>
            )}

            {registrationsLoading ? (
              <div className="empty-state">Loading registrations...</div>
            ) : registrations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Users size={25} />
                </div>
                <h3>No registrations yet</h3>
                <p>
                  Use “Register participant” to add the first participant.
                </p>
              </div>
            ) : (
              <div className="events-grid">
                {registrations.map((registration) => (
                  <article className="event-card" key={registration._id}>
                    <div className="event-banner banner-other">
                      <div className="banner-icon">
                        <Users size={25} />
                      </div>
                      <span className="status-pill">
                        {registration.status}
                      </span>
                      <span className="category-label">Participant</span>
                    </div>

                    <div className="event-details">
                      <h3>{registration.participantName}</h3>
                      <p className="event-description">
                        {registration.event?.title || "Event unavailable"}
                      </p>

                      <div className="event-meta">
                        <span>Email: {registration.email}</span>
                      </div>
                      <div className="event-meta">
                        <span>
                          Contact: {registration.contactNumber || "Not provided"}
                        </span>
                      </div>
                      <div className="event-meta">
                        <MapPin size={16} />
                        <span>
                          {registration.event?.venue || "Venue unavailable"}
                        </span>
                      </div>

                      <div className="event-footer">
                        <span>
                          {registration.event?.startDate
                            ? new Date(
                                registration.event.startDate
                              ).toLocaleDateString()
                            : "Date unavailable"}
                        </span>

                        {registration.status === "Registered" && (
                          <button
                            className="delete-button"
                            onClick={() =>
                              cancelRegistration(registration._id)
                            }
                          >
                            <X size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>


{activeSection === "ai-assistant" && (
  <section className="events-section" id="ai-assistant">
    <div className="section-heading">
      <div>
        <h2>AI Event Planning Assistant</h2>
        <p>
          Get AI-powered recommendations using your event,
          registration, and production team data.
        </p>
      </div>
    </div>

    <div className="ai-assistant-card">
      <form onSubmit={askAI}>
        <label htmlFor="ai-question">
          What would you like help with?
        </label>

        <textarea
          id="ai-question"
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          placeholder="Example: Help me plan the production requirements for upcoming events."
          rows={4}
        />

        <button type="submit" disabled={aiLoading}>
          <Sparkles size={16} />
          {aiLoading ? "Generating..." : "Ask AI Assistant"}
        </button>
      </form>

      {aiError && (
        <p className="ai-error">{aiError}</p>
      )}

      {aiAnswer && (
       
<div className="ai-answer">
  <div className="ai-answer-heading">
    <div className="ai-answer-icon">
      <Sparkles size={20} />
    </div>
    <div>
      <h3>AI Recommendations</h3>
      <p>Suggestions based on your current database records</p>
    </div>
  </div>

  <div className="ai-answer-content">
  <div className="ai-source-label">
    {aiFallback
      ? "Database-based fallback"
      : "Gemini AI response"}
  </div>

  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {aiAnswer}
  </ReactMarkdown>
</div>
</div>

      )}
    </div>
  </section>
)}


          {showEventForm && (
            <div
              className="modal-backdrop"
              onClick={() => {
                setShowEventForm(false);
                setEditingEventId(null);
              }}
            >
              <section
                className="event-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-heading">
                  <div>
                    <span className="eyebrow">
                      {editingEventId ? "UPDATE LISTING" : "NEW LISTING"}
                    </span>
                    <h2>{editingEventId ? "Edit event" : "Create an event"}</h2>
                  </div>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      setShowEventForm(false);
                      setEditingEventId(null);
                    }}
                    aria-label="Close"
                  >
                    <X />
                  </button>
                </div>

                <form onSubmit={saveEvent}>
                  <label>
                    Event title
                    <input
                      required
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                      placeholder="e.g. Annual Cultural Fest"
                    />
                  </label>

                  <label>
                    Description
                    <textarea
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="What's the event about?"
                    />
                  </label>

                  <div className="form-row">
                    <label>
                      Category
                      <select
                        value={eventForm.category}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            category: e.target.value,
                          })
                        }
                      >
                        {[
                          "Cultural",
                          "Technical",
                          "Workshop",
                          "Sports",
                          "Theatre",
                          "Other",
                        ].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Capacity
                      <input
                        required
                        type="number"
                        min="1"
                        value={eventForm.capacity}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            capacity: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Start date &amp; time
                      <input
                        required
                        type="datetime-local"
                        value={eventForm.startDate}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      End date &amp; time
                      <input
                        required
                        type="datetime-local"
                        value={eventForm.endDate}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Venue
                    <input
                      required
                      value={eventForm.venue}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, venue: e.target.value })
                      }
                      placeholder="e.g. Main Auditorium"
                    />
                  </label>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setShowEventForm(false);
                        setEditingEventId(null);
                      }}
                    >
                      Close
                    </button>

                    <button type="submit" className="primary-button">
                      {editingEventId ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={17} />
                      )}
                      {editingEventId ? "Save changes" : "Save event"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {showRegistrationForm && (
            <div
              className="modal-backdrop"
              onClick={() => setShowRegistrationForm(false)}
            >
              <section
                className="event-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-heading">
                  <div>
                    <span className="eyebrow">CAMPUSCONNECT</span>
                    <h2>Register participant</h2>
                  </div>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowRegistrationForm(false)}
                    aria-label="Close"
                  >
                    <X />
                  </button>
                </div>

                <form onSubmit={registerParticipant}>
                  <label>
                    Select event
                    <select
                      required
                      value={registrationForm.eventId}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          eventId: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose an event</option>
                      {registerableEvents.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title} — {event.venue}
                        </option>
                      ))}
                    </select>
                  </label>

                  {registerableEvents.length === 0 && (
                    <p>No available events. Create an event first.</p>
                  )}

                  <label>
                    Participant name
                    <input
                      required
                      value={registrationForm.participantName}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          participantName: e.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </label>

                  <label>
                    Email address
                    <input
                      required
                      type="email"
                      value={registrationForm.email}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="participant@example.com"
                    />
                  </label>

                  <label>
                    Contact number
                    <input
                      type="tel"
                      value={registrationForm.contactNumber}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          contactNumber: e.target.value,
                        })
                      }
                      placeholder="Enter contact number"
                    />
                  </label>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setShowRegistrationForm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        registrationSubmitting ||
                        registerableEvents.length === 0
                      }
                    >
                      <Plus size={17} />
                      {registrationSubmitting
                        ? "Registering..."
                        : "Register participant"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
