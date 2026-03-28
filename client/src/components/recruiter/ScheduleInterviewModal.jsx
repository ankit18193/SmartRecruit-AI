import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { scheduleInterview } from "../../services/api";
import toast from "react-hot-toast";

const ScheduleInterviewModal = ({ applicationId, onClose, onSuccess }) => {

  const [date, setDate] = useState(null);
  const [mode, setMode] = useState("Google Meet");
  const [link, setLink] = useState("");

  const handleSubmit = async () => {

    if (!date) {
      return toast.error("Please select interview date");
    }

    try {

      await scheduleInterview(applicationId, {
        interviewDate: date,
        interviewMode: mode,
        interviewLink: link
      });

      toast.success("Interview Scheduled");

      onSuccess();
      onClose();

    } catch (error) {
      toast.error("Failed to schedule interview");
    }

  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white p-8 rounded-3xl w-[420px] shadow-xl">

        <h2 className="text-xl font-bold mb-6">
          Schedule Interview
        </h2>

        <div className="space-y-4">

          <div>
            <label className="text-sm font-medium">
              Interview Date
            </label>

            <DatePicker
              selected={date}
              onChange={(d) => setDate(d)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              showTimeSelect
              dateFormat="Pp"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Interview Mode
            </label>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            >
              <option>Google Meet</option>
              <option>Zoom</option>
              <option>Phone</option>
              <option>In-Person</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Meeting Link
            </label>

            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste meeting link"
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Schedule
          </button>

        </div>

      </div>

    </div>
  );
};

export default ScheduleInterviewModal;