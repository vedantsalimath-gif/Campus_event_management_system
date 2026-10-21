
import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    responsibilities: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const productionTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: [
        "Direction",
        "Acting",
        "Camera",
        "Video Editing",
        "Sound",
        "Stage Management",
        "Social Media",
        "Production",
        "Other",
      ],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    members: {
      type: [teamMemberSchema],
      default: [],
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  { timestamps: true }
);

productionTeamSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("ProductionTeam", productionTeamSchema);
