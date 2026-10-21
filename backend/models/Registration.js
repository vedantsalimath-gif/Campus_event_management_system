
import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    participantName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    contactNumber: {
      type: String,
      trim: true,
      default: ""
    },

    status: {
      type: String,
      enum: ["Registered", "Cancelled"],
      default: "Registered"
    }
  },
  { timestamps: true }
);

// Prevent duplicate registrations for the same event and email.
registrationSchema.index(
  { event: 1, email: 1 },
  { unique: true }
);

// Speed up queries for registrations belonging to an event.
registrationSchema.index({ event: 1, status: 1 });

const Registration = mongoose.model(
  "Registration",
  registrationSchema
);

export default Registration;
