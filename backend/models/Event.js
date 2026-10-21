
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      enum: [
        "Cultural",
        "Technical",
        "Workshop",
        "Sports",
        "Theatre",
        "Other"
      ],
      default: "Other"
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    venue: {
      type: String,
      required: true,
      trim: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming"
    }
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1, status: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
